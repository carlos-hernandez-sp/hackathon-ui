import { AuthType, WizardState } from '../../saas-connectivity-creator/saas-connectivity-creator.models';
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

function buildAccountInterface(state: WizardState): string {
    const fields = state.accountAttributes.map((a) => {
        const type = a.type === 'boolean' ? 'boolean' : a.type === 'int' || a.type === 'long' ? 'number' : 'string';
        return `    ${a.name}: ${type};`;
    });
    return `export interface Account {\n${fields.join('\n')}\n}`;
}

function buildEntitlementInterface(state: WizardState): string {
    const fields = state.entitlementAttributes.map((a) => `    ${a.name}: string;`);
    return `export interface Entitlement {\n${fields.join('\n')}\n}`;
}

function buildMappingAssignments(mappings: { source: string; target: string }[]): string {
    return mappings
        .map((m) => `            ${m.target}: this.readMappedValue(record, '${escapeString(m.source)}'),`)
        .join('\n');
}

function buildHeadersLiteral(headers: { key: string; value: string }[]): string {
    if (headers.length === 0) return '{}';
    const entries = headers
        .filter((h) => h.key)
        .map((h) => `        '${escapeString(h.key)}': '${escapeString(h.value)}',`);
    return `{\n${entries.join('\n')}\n    }`;
}

function buildAuthConstructor(authType: AuthType): string {
    switch (authType) {
        case 'oauth2':
            return `        if (config?.clientId == null || config?.clientSecret == null) {
            throw new ConnectorError('clientId and clientSecret must be provided from config')
        }
        if (config?.tokenUrl == null) {
            throw new ConnectorError('tokenUrl must be provided from config')
        }
        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl),
            auth: {
                type: 'oauth2ClientCredentials',
                tokenUrl: String(config.tokenUrl),
                clientId: String(config.clientId),
                clientSecret: String(config.clientSecret),
                scope: config.scopes ? String(config.scopes) : undefined,
            },
        })`;
        case 'basicAuth':
            return `        if (config?.username == null || config?.password == null) {
            throw new ConnectorError('username and password must be provided from config')
        }
        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl),
            auth: {
                type: 'basic',
                username: String(config.username),
                password: String(config.password),
            },
        })`;
        case 'bearerToken':
            return `        if (config?.token == null) {
            throw new ConnectorError('token must be provided from config')
        }
        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl),
            auth: { type: 'bearer', token: String(config.token) },
        })`;
        case 'custom':
            return `        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl ?? ''),
        })`;
        case 'apiKey':
        default:
            return `        if (config?.apiKey == null) {
            throw new ConnectorError('apiKey must be provided from config')
        }
        this.httpClient = createConnectorHttpClient({
            baseURL: String(config.apiUrl),
            auth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                value: String(config.apiKey),
            },
        })`;
    }
}

function buildOptionalMethods(mapping: CanvasMappingResult, identityTarget: string): string {
    const methods: string[] = [];
    const c = mapping.state.commands;
    const lifecycle = mapping.accountLifecycle;
    const ent = mapping.entitlements;

    if (c.entitlementList || c.entitlementRead) {
        const entEndpoint = escapeString(ent?.endpoint ?? '/groups');
        const entMethod = escapeString(ent?.method ?? 'GET');
        methods.push(`
    async getEntitlements(): Promise<Entitlement[]> {
        const response = await this.requestEntitlements('${entEndpoint}', '${entMethod}')
        const records = this.extractEntitlementRecords(response.data)
        return records.map((record) => this.mapEntitlement(record))
    }

    async getEntitlement(key: string): Promise<Entitlement> {
        const groups = await this.getEntitlements()
        const match = groups.find((g) => g.${mapping.state.entitlementIdentityAttribute} === key)
        if (!match) {
            throw new ConnectorError(\`Entitlement not found: \${key}\`)
        }
        return match
    }`);
    }

    if (c.accountCreate && lifecycle?.createEndpoint) {
        methods.push(`
    async createAccount(input: Record<string, unknown>): Promise<Account> {
        const response = await this.httpClient.post('${escapeString(lifecycle.createEndpoint)}', input.attributes ?? input)
        const records = this.extractRecords(response.data)
        return records.length > 0 ? this.mapRecord(records[0]) : (input.attributes as Account)
    }`);
    }

    if (c.accountUpdate && lifecycle?.updateEndpoint) {
        methods.push(`
    async updateAccount(key: string, _changes: unknown[]): Promise<void> {
        const path = '${escapeString(lifecycle.updateEndpoint)}'.replace('{id}', key)
        await this.httpClient.put(path, {})
    }`);
    }

    if (c.accountDelete && lifecycle?.deleteEndpoint) {
        methods.push(`
    async deleteAccount(key: string): Promise<void> {
        const path = '${escapeString(lifecycle.deleteEndpoint)}'.replace('{id}', key)
        await this.httpClient.delete(path)
    }`);
    }

    if (c.accountEnable && lifecycle?.enableEndpoint) {
        methods.push(`
    async enableAccount(key: string): Promise<Account> {
        const path = '${escapeString(lifecycle.enableEndpoint)}'.replace('{id}', key)
        const response = await this.httpClient.post(path, {})
        const records = this.extractRecords(response.data)
        return records.length > 0 ? this.mapRecord(records[0]) : await this.getAccount(key)
    }`);
    }

    if (c.accountDisable && lifecycle?.disableEndpoint) {
        methods.push(`
    async disableAccount(key: string): Promise<Account> {
        const path = '${escapeString(lifecycle.disableEndpoint)}'.replace('{id}', key)
        const response = await this.httpClient.post(path, {})
        const records = this.extractRecords(response.data)
        return records.length > 0 ? this.mapRecord(records[0]) : await this.getAccount(key)
    }`);
    }

    if (c.accountUnlock && lifecycle?.unlockEndpoint) {
        methods.push(`
    async unlockAccount(key: string): Promise<Account> {
        const path = '${escapeString(lifecycle.unlockEndpoint)}'.replace('{id}', key)
        const response = await this.httpClient.post(path, {})
        const records = this.extractRecords(response.data)
        return records.length > 0 ? this.mapRecord(records[0]) : await this.getAccount(key)
    }`);
    }

    if (c.changePassword && lifecycle?.changePasswordEndpoint) {
        methods.push(`
    async changePassword(key: string, password: string): Promise<void> {
        const path = '${escapeString(lifecycle.changePasswordEndpoint)}'.replace('{id}', key)
        await this.httpClient.post(path, { password })
    }`);
    }

    return methods.join('\n');
}

export function generateVisualConnectorClient(mapping: CanvasMappingResult): string {
    const className = `${toClassName(mapping.state.connectorName)}Client`;
    const state = mapping.state;
    const accountInterface = buildAccountInterface(state);
    const hasEntitlements = state.commands.entitlementList || state.commands.entitlementRead;
    const entitlementInterface = hasEntitlements ? buildEntitlementInterface(state) + '\n\n' : '';
    const mappingAssignments = buildMappingAssignments(mapping.mappings);
    const identityTarget = mapping.mappings[0]?.target ?? state.identityAttribute;
    const identitySource = mapping.mappings[0]?.source ?? 'id';
    const headersLiteral = buildHeadersLiteral(mapping.apiHeaders);
    const pagination = mapping.pagination ?? { strategy: 'offset' as const, pageSize: 100 };
    const recordKeys = (mapping.responseParser?.recordsPath ?? 'data,items,results,records,users,accounts')
        .split(',')
        .map((k) => `'${escapeString(k.trim())}'`)
        .join(', ');
    const cursorKeys = (mapping.responseParser?.cursorPath ?? 'nextCursor,next_cursor,next,cursor')
        .split(',')
        .map((k) => `'${escapeString(k.trim())}'`)
        .join(', ');
    const entitlementKeys = (mapping.responseParser?.entitlementsPath ?? 'data,items,groups,entitlements')
        .split(',')
        .map((k) => `'${escapeString(k.trim())}'`)
        .join(', ');
    const getAccountsBody =
        pagination.strategy === 'cursor'
            ? 'return this.getAccountsWithCursor()'
            : 'return this.getAccountsWithOffset()';
    const testConnectionBody =
        pagination.strategy === 'cursor'
            ? 'await this.request(this.endpointPath, { params: { limit: 1 } })'
            : 'await this.fetchRecords({ offset: 0, limit: 1 })';
    const optionalMethods = buildOptionalMethods(mapping, identityTarget);
    const entMapFields = state.entitlementAttributes
        .map((a) => `            ${a.name}: this.readMappedValue(record, '${escapeString(a.name)}'),`)
        .join('\n');
    const statefulField = mapping.stateful?.stateField ?? 'updatedAt';

    return `import { ConnectorError, createConnectorHttpClient, AxiosInstance } from '@sailpoint/connector-sdk'

${accountInterface}

${entitlementInterface}const DEFAULT_API_ENDPOINT = '${escapeString(mapping.apiPath)}'
const DEFAULT_HTTP_METHOD = '${escapeString(mapping.httpMethod)}'
const PAGE_SIZE = ${pagination.pageSize}
const RECORD_KEYS = [${recordKeys}]
const CURSOR_KEYS = [${cursorKeys}]
const ENTITLEMENT_KEYS = [${entitlementKeys}]
const CUSTOM_HEADERS: Record<string, string> = ${headersLiteral}
${mapping.stateful?.enabled ? `const STATE_FIELD = '${escapeString(statefulField)}'` : ''}

export class ${className} {
    private httpClient: AxiosInstance
    private readonly endpointPath: string
    private readonly httpMethod: string

    constructor(config: Record<string, unknown>) {
        if (config?.apiUrl == null) {
            throw new ConnectorError('apiUrl must be provided from config')
        }
${buildAuthConstructor(mapping.authType)}
        this.endpointPath = String(config.apiEndpoint ?? DEFAULT_API_ENDPOINT)
        this.httpMethod = String(config.httpMethod ?? DEFAULT_HTTP_METHOD).toUpperCase()
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
            const response = await this.request(this.endpointPath, { params: { id: key } })
            const records = this.extractRecords(response.data)
            const direct = records.find((record) => this.matchesIdentity(record, key))
            if (direct) return this.mapRecord(direct)
        } catch { /* fallback to list */ }
        const accounts = await this.getAccounts()
        const match = accounts.find((account) => account.${identityTarget} === key)
        if (!match) throw new ConnectorError(\`Account not found for identity: \${key}\`)
        return match
    }
${optionalMethods}

    private async getAccountsWithOffset(): Promise<Account[]> {
        const accounts: Account[] = []
        let offset = 0
        while (true) {
            const records = await this.fetchRecords({ offset, limit: PAGE_SIZE })
            if (records.length === 0) break
            accounts.push(...records.map((r) => this.mapRecord(r)))
            if (records.length < PAGE_SIZE) break
            offset += PAGE_SIZE
        }
        return accounts
    }

    private async getAccountsWithCursor(): Promise<Account[]> {
        const accounts: Account[] = []
        let cursor: string | null = null
        while (true) {
            const response = await this.request(this.endpointPath, {
                params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
            })
            const records = this.extractRecords(response.data)
            if (records.length === 0) break
            accounts.push(...records.map((r) => this.mapRecord(r)))
            cursor = this.extractNextCursor(response.data)
            if (!cursor) break
        }
        return accounts
    }

    private async fetchRecords(params: Record<string, string | number>): Promise<Record<string, unknown>[]> {
        const response = await this.request(this.endpointPath, { params })
        return this.extractRecords(response.data)
    }

    private async request(path: string, options: { params?: Record<string, string | number> } = {}) {
        const config = { params: options.params, headers: { ...CUSTOM_HEADERS } }
        switch (this.httpMethod) {
            case 'POST': return this.httpClient.post(path, { ...options.params }, config)
            case 'PUT': return this.httpClient.put(path, { ...options.params }, config)
            case 'DELETE': return this.httpClient.delete(path, config)
            default: return this.httpClient.get(path, config)
        }
    }

    private async requestEntitlements(path: string, method: string) {
        const config = { headers: { ...CUSTOM_HEADERS } }
        return method === 'POST' ? this.httpClient.post(path, {}, config) : this.httpClient.get(path, config)
    }

    private extractRecords(data: unknown): Record<string, unknown>[] {
        if (Array.isArray(data)) {
            return data.filter((i) => i && typeof i === 'object') as Record<string, unknown>[]
        }
        if (data && typeof data === 'object') {
            const container = data as Record<string, unknown>
            for (const key of RECORD_KEYS) {
                const value = container[key]
                if (Array.isArray(value)) {
                    return value.filter((i) => i && typeof i === 'object') as Record<string, unknown>[]
                }
            }
        }
        return []
    }

    private extractEntitlementRecords(data: unknown): Record<string, unknown>[] {
        if (Array.isArray(data)) {
            return data.filter((i) => i && typeof i === 'object') as Record<string, unknown>[]
        }
        if (data && typeof data === 'object') {
            const container = data as Record<string, unknown>
            for (const key of ENTITLEMENT_KEYS) {
                const value = container[key]
                if (Array.isArray(value)) {
                    return value.filter((i) => i && typeof i === 'object') as Record<string, unknown>[]
                }
            }
        }
        return []
    }

    private extractNextCursor(data: unknown): string | null {
        if (!data || typeof data !== 'object') return null
        const container = data as Record<string, unknown>
        for (const key of CURSOR_KEYS) {
            const value = container[key]
            if (typeof value === 'string' && value.length > 0) return value
        }
        const pagination = container.pagination
        if (pagination && typeof pagination === 'object') {
            for (const key of CURSOR_KEYS) {
                const value = (pagination as Record<string, unknown>)[key]
                if (typeof value === 'string' && value.length > 0) return value
            }
        }
        return null
    }

    private mapRecord(record: Record<string, unknown>): Account {
        return {
${mappingAssignments}
        }
    }

    private mapEntitlement(record: Record<string, unknown>): Entitlement {
        return {
${entMapFields}
        }
    }

    private readMappedValue(record: Record<string, unknown>, sourceField: string): string {
        const value = this.getNestedValue(record, sourceField)
        if (value == null) return ''
        if (Array.isArray(value)) return value.map((i) => String(i)).join(',')
        return String(value)
    }

    private getNestedValue(record: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((current, segment) => {
            if (!current || typeof current !== 'object') return undefined
            return (current as Record<string, unknown>)[segment]
        }, record)
    }

    private matchesIdentity(record: Record<string, unknown>, key: string): boolean {
        return this.readMappedValue(record, '${escapeString(identitySource)}') === key
    }
}
`;
}

export function generateConfigExample(mapping: CanvasMappingResult): string {
    const base: Record<string, unknown> = {
        apiUrl: mapping.state.authConfig['apiUrl'] ?? 'https://api.example.com',
        apiEndpoint: mapping.apiPath,
        httpMethod: mapping.httpMethod,
    };

    switch (mapping.authType) {
        case 'oauth2':
            Object.assign(base, {
                clientId: 'your-client-id',
                clientSecret: 'your-client-secret',
                tokenUrl: mapping.state.authConfig['tokenUrl'] ?? 'https://api.example.com/oauth/token',
                scopes: mapping.state.authConfig['scopes'] ?? '',
            });
            break;
        case 'basicAuth':
            Object.assign(base, { username: 'user', password: 'password' });
            break;
        case 'bearerToken':
            Object.assign(base, { token: 'your-bearer-token' });
            break;
        default:
            base['apiKey'] = 'your-api-key';
    }

    if (mapping.entitlements) {
        base['entitlementsEndpoint'] = mapping.entitlements.endpoint;
        base['entitlementsMethod'] = mapping.entitlements.method;
    }

    if (mapping.accountLifecycle) {
        Object.assign(base, mapping.accountLifecycle);
    }

    if (mapping.stateful?.enabled) {
        base['spConnEnableStatefulCommands'] = true;
    }

    return JSON.stringify(base, null, 2) + '\n';
}
