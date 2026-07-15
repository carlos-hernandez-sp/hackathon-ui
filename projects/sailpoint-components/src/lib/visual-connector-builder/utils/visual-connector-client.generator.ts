import { CanvasMappingResult } from './canvas-to-wizard-state.mapper';

function toClassName(connectorName: string): string {
    return connectorName
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function escapeString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildAccountInterface(mappings: { source: string; target: string }[]): string {
    const fields = mappings.map(
        (m) => `    ${m.target}: string;`,
    );
    return `export interface Account {\n${fields.join('\n')}\n}`;
}

function buildMappingAssignments(mappings: { source: string; target: string }[]): string {
    return mappings
        .map(
            (m) =>
                `            ${m.target}: this.readMappedValue(record, '${escapeString(m.source)}'),`,
        )
        .join('\n');
}

function buildHeadersLiteral(headers: { key: string; value: string }[]): string {
    if (headers.length === 0) {
        return '{}';
    }
    const entries = headers
        .filter((h) => h.key)
        .map((h) => `        '${escapeString(h.key)}': '${escapeString(h.value)}',`);
    return `{\n${entries.join('\n')}\n    }`;
}

export function generateVisualConnectorClient(mapping: CanvasMappingResult): string {
    const className = `${toClassName(mapping.state.connectorName)}Client`;
    const accountInterface = buildAccountInterface(mapping.mappings);
    const mappingAssignments = buildMappingAssignments(mapping.mappings);
    const identityTarget = mapping.mappings[0]?.target ?? 'identity';
    const headersLiteral = buildHeadersLiteral(mapping.apiHeaders);
    const pagination = mapping.pagination ?? { strategy: 'offset' as const, pageSize: 100 };
    const defaultEndpoint = escapeString(mapping.apiPath);
    const defaultMethod = escapeString(mapping.httpMethod);
    const getAccountsBody =
        pagination.strategy === 'cursor'
            ? 'return this.getAccountsWithCursor()'
            : 'return this.getAccountsWithOffset()';
    const testConnectionBody =
        pagination.strategy === 'cursor'
            ? 'await this.request(this.endpointPath, { params: { limit: 1 } })'
            : 'await this.fetchRecords({ offset: 0, limit: 1 })';

    return `import { ConnectorError, createConnectorHttpClient, AxiosInstance } from '@sailpoint/connector-sdk'

${accountInterface}

const DEFAULT_API_ENDPOINT = '${defaultEndpoint}'
const DEFAULT_HTTP_METHOD = '${defaultMethod}'
const PAGE_SIZE = ${pagination.pageSize}
const CUSTOM_HEADERS: Record<string, string> = ${headersLiteral}

export class ${className} {
    private httpClient: AxiosInstance
    private readonly endpointPath: string
    private readonly httpMethod: string

    constructor(config: Record<string, unknown>) {
        if (config?.apiUrl == null) {
            throw new ConnectorError('apiUrl must be provided from config')
        }
        if (config?.apiKey == null) {
            throw new ConnectorError('apiKey must be provided from config')
        }

        this.endpointPath = String(config.apiEndpoint ?? DEFAULT_API_ENDPOINT)
        this.httpMethod = String(config.httpMethod ?? DEFAULT_HTTP_METHOD).toUpperCase()

        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl),
            auth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                value: String(config.apiKey),
            },
        })
    }

    async testConnection(): Promise<Record<string, unknown>> {
        ${testConnectionBody}
        return { status: 'ok', endpoint: this.endpointPath, method: this.httpMethod }
    }

    async getAccounts(): Promise<Account[]> {
        ${getAccountsBody}
    }

    async getAccount(key: string): Promise<Account> {
        try {
            const response = await this.request(this.endpointPath, {
                params: { id: key },
            })
            const records = this.extractRecords(response.data)
            const direct = records.find((record) => this.matchesIdentity(record, key))
            if (direct) {
                return this.mapRecord(direct)
            }
        } catch {
            // Fall back to list lookup when the API does not support direct reads.
        }

        const accounts = await this.getAccounts()
        const match = accounts.find((account) => account.${identityTarget} === key)
        if (!match) {
            throw new ConnectorError(\`Account not found for identity: \${key}\`)
        }
        return match
    }

    private async getAccountsWithOffset(): Promise<Account[]> {
        const accounts: Account[] = []
        let offset = 0

        while (true) {
            const records = await this.fetchRecords({ offset, limit: PAGE_SIZE })
            if (records.length === 0) {
                break
            }

            accounts.push(...records.map((record) => this.mapRecord(record)))
            if (records.length < PAGE_SIZE) {
                break
            }
            offset += PAGE_SIZE
        }

        return accounts
    }

    private async getAccountsWithCursor(): Promise<Account[]> {
        const accounts: Account[] = []
        let cursor: string | null = null

        while (true) {
            const response = await this.request(this.endpointPath, {
                params: {
                    limit: PAGE_SIZE,
                    ...(cursor ? { cursor } : {}),
                },
            })
            const records = this.extractRecords(response.data)
            if (records.length === 0) {
                break
            }

            accounts.push(...records.map((record) => this.mapRecord(record)))
            cursor = this.extractNextCursor(response.data)
            if (!cursor) {
                break
            }
        }

        return accounts
    }

    private async fetchRecords(params: Record<string, string | number>): Promise<Record<string, unknown>[]> {
        const response = await this.request(this.endpointPath, { params })
        return this.extractRecords(response.data)
    }

    private async request(path: string, options: { params?: Record<string, string | number> } = {}) {
        const headers = { ...CUSTOM_HEADERS }
        const config = {
            params: options.params,
            headers,
        }

        switch (this.httpMethod) {
            case 'POST':
                return this.httpClient.post(path, { ...options.params }, config)
            case 'PUT':
                return this.httpClient.put(path, { ...options.params }, config)
            case 'DELETE':
                return this.httpClient.delete(path, config)
            case 'GET':
            default:
                return this.httpClient.get(path, config)
        }
    }

    private extractRecords(data: unknown): Record<string, unknown>[] {
        if (Array.isArray(data)) {
            return data.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
        }

        if (data && typeof data === 'object') {
            const container = data as Record<string, unknown>
            for (const key of ['data', 'items', 'results', 'records', 'users', 'accounts']) {
                const value = container[key]
                if (Array.isArray(value)) {
                    return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
                }
            }
        }

        return []
    }

    private extractNextCursor(data: unknown): string | null {
        if (!data || typeof data !== 'object') {
            return null
        }

        const container = data as Record<string, unknown>
        const cursorKeys = ['nextCursor', 'next_cursor', 'next', 'cursor']
        for (const key of cursorKeys) {
            const value = container[key]
            if (typeof value === 'string' && value.length > 0) {
                return value
            }
        }

        const pagination = container.pagination
        if (pagination && typeof pagination === 'object') {
            for (const key of cursorKeys) {
                const value = (pagination as Record<string, unknown>)[key]
                if (typeof value === 'string' && value.length > 0) {
                    return value
                }
            }
        }

        return null
    }

    private mapRecord(record: Record<string, unknown>): Account {
        return {
${mappingAssignments}
        }
    }

    private readMappedValue(record: Record<string, unknown>, sourceField: string): string {
        const value = this.getNestedValue(record, sourceField)
        if (value == null) {
            return ''
        }
        if (Array.isArray(value)) {
            return value.map((item) => String(item)).join(',')
        }
        return String(value)
    }

    private getNestedValue(record: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((current, segment) => {
            if (!current || typeof current !== 'object') {
                return undefined
            }
            return (current as Record<string, unknown>)[segment]
        }, record)
    }

    private matchesIdentity(record: Record<string, unknown>, key: string): boolean {
        return this.readMappedValue(record, '${escapeString(mapping.mappings[0]?.source ?? 'id')}') === key
    }
}
`;
}

export function generateConfigExample(mapping: CanvasMappingResult): string {
    const example = {
        apiUrl: mapping.state.authConfig['apiUrl'] ?? 'https://api.example.com',
        apiKey: 'your-api-key',
        apiEndpoint: mapping.apiPath,
        httpMethod: mapping.httpMethod,
    };
    return JSON.stringify(example, null, 2) + '\n';
}
