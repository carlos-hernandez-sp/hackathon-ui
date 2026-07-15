import {
    AccountAttribute,
    AuthType,
    CommandSelection,
    DEFAULT_ACCOUNT_ATTRIBUTES,
    DEFAULT_ENTITLEMENT_ATTRIBUTES,
    WizardState,
} from '../../saas-connectivity-creator/saas-connectivity-creator.models';
import { CanvasSnapshot } from '../models/canvas-state';
import {
    AccountLifecycleNodeData,
    AccountSchemaNodeData,
    AuthenticationNodeData,
    CommandsConfig,
    CommandsNodeData,
    ConnectorNodeData,
    DataTransformNodeData,
    DEFAULT_COMMANDS_CONFIG,
    EntitlementsNodeData,
    PaginationNodeData,
    ResponseParserNodeData,
    StatefulAggregationNodeData,
} from '../models/node-types';

const CONNECTOR_NAME = 'custom-sailpoint-connector';
const DEFAULT_API_PATH = '/users';
const DEFAULT_BASE_URL = 'https://api.example.com';

export interface CanvasMappingResult {
    state: WizardState;
    pipelineOrder: string[];
    apiEndpoint: string;
    apiPath: string;
    httpMethod: string;
    apiHeaders: { key: string; value: string }[];
    pagination?: PaginationNodeData['config'];
    mappings: { source: string; target: string }[];
    responseParser?: ResponseParserNodeData['config'];
    entitlements?: EntitlementsNodeData['config'];
    accountLifecycle?: AccountLifecycleNodeData['config'];
    stateful?: StatefulAggregationNodeData['config'];
    authType: AuthType;
}

function resolveEndpoint(endpoint: string): { baseUrl: string; apiPath: string } {
    const trimmed = endpoint.trim();
    if (!trimmed) {
        return { baseUrl: DEFAULT_BASE_URL, apiPath: DEFAULT_API_PATH };
    }
    try {
        const url = new URL(trimmed);
        const path = `${url.pathname}${url.search}`;
        return {
            baseUrl: `${url.protocol}//${url.host}`,
            apiPath: path.length > 1 ? path : DEFAULT_API_PATH,
        };
    } catch {
        const apiPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return { baseUrl: DEFAULT_BASE_URL, apiPath };
    }
}

function buildAccountAttributesFromMappings(
    mappings: { source: string; target: string }[],
): AccountAttribute[] {
    if (mappings.length === 0) {
        return DEFAULT_ACCOUNT_ATTRIBUTES.map((attr) => ({ ...attr }));
    }
    return mappings.map((mapping) => ({
        name: mapping.target,
        type: 'string' as const,
        description: `Mapped from source field "${mapping.source}"`,
        multi: false,
        entitlement: false,
        managed: false,
    }));
}

function topologicalOrder(snapshot: CanvasSnapshot): string[] {
    const nodeIds = snapshot.nodes.map((n) => n.id);
    const incoming = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of nodeIds) {
        incoming.set(id, 0);
        adjacency.set(id, []);
    }

    for (const edge of snapshot.edges) {
        if (!incoming.has(edge.target) || !adjacency.has(edge.source)) {
            continue;
        }
        incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
        adjacency.get(edge.source)!.push(edge.target);
    }

    const queue = nodeIds.filter((id) => (incoming.get(id) ?? 0) === 0);
    const order: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        order.push(current);
        for (const next of adjacency.get(current) ?? []) {
            const count = (incoming.get(next) ?? 1) - 1;
            incoming.set(next, count);
            if (count === 0) {
                queue.push(next);
            }
        }
    }

    const remaining = nodeIds.filter((id) => !order.includes(id));
    return [...order, ...remaining];
}

function findNodeData<T extends ConnectorNodeData['nodeType']>(
    snapshot: CanvasSnapshot,
    nodeType: T,
): Extract<ConnectorNodeData, { nodeType: T }> | null {
    const node = snapshot.nodes.find((n) => n.data.nodeType === nodeType);
    return (node?.data as Extract<ConnectorNodeData, { nodeType: T }>) ?? null;
}

function buildAuthConfig(auth: AuthenticationNodeData['config']): Record<string, string> {
    return {
        apiUrl: auth.apiUrl,
        keyLabel: auth.keyLabel,
        tokenLabel: auth.tokenLabel,
        usernameLabel: auth.usernameLabel,
        passwordLabel: auth.passwordLabel,
        tokenUrl: auth.tokenUrl,
        scopes: auth.scopes,
    };
}

function resolveCommands(
    commandsData: CommandsNodeData | null,
    entitlementsData: EntitlementsNodeData | null,
    lifecycleData: AccountLifecycleNodeData | null,
): CommandSelection {
    const base: CommandsConfig = commandsData?.config
        ? { ...commandsData.config }
        : { ...DEFAULT_COMMANDS_CONFIG };

    if (entitlementsData && !commandsData) {
        base.entitlementList = true;
        base.entitlementRead = true;
    }

    if (lifecycleData && !commandsData) {
        if (lifecycleData.config.createEndpoint) base.accountCreate = true;
        if (lifecycleData.config.updateEndpoint) base.accountUpdate = true;
        if (lifecycleData.config.deleteEndpoint) base.accountDelete = true;
        if (lifecycleData.config.enableEndpoint) base.accountEnable = true;
        if (lifecycleData.config.disableEndpoint) base.accountDisable = true;
        if (lifecycleData.config.unlockEndpoint) base.accountUnlock = true;
        if (lifecycleData.config.changePasswordEndpoint) base.changePassword = true;
    }

    return base;
}

export function mapCanvasToWizardState(snapshot: CanvasSnapshot): CanvasMappingResult {
    const authData = findNodeData(snapshot, 'authentication');
    const apiData = findNodeData(snapshot, 'api-request');
    const parserData = findNodeData(snapshot, 'response-parser');
    const transformData = findNodeData(snapshot, 'data-transform');
    const paginationData = findNodeData(snapshot, 'pagination');
    const schemaData = findNodeData(snapshot, 'account-schema');
    const commandsData = findNodeData(snapshot, 'commands');
    const entitlementsData = findNodeData(snapshot, 'entitlements');
    const lifecycleData = findNodeData(snapshot, 'account-lifecycle');
    const statefulData = findNodeData(snapshot, 'stateful-aggregation');

    const endpoint = apiData?.config.endpoint?.trim() ?? '';
    const { baseUrl: endpointBase, apiPath } = resolveEndpoint(endpoint);
    const method = apiData?.config.method ?? 'GET';
    const apiHeaders = (apiData?.config.headers ?? []).filter((h) => h.key || h.value);
    const mappings = transformData?.config.mappings ?? [{ source: 'id', target: 'identity' }];
    const pipelineOrder = topologicalOrder(snapshot);

    const authType: AuthType = authData?.config.authType ?? 'apiKey';
    const baseUrl = authData?.config.apiUrl?.trim() || endpointBase;

    let accountAttributes: AccountAttribute[];
    let displayAttribute: string;
    let identityAttribute: string;
    let groupAttribute: string;

    if (schemaData) {
        accountAttributes = schemaData.config.attributes.map((a) => ({
            name: a.name,
            type: a.type,
            description: a.description,
            multi: a.multi,
            entitlement: a.entitlement,
            managed: a.managed,
        }));
        displayAttribute = schemaData.config.displayAttribute;
        identityAttribute = schemaData.config.identityAttribute;
        groupAttribute = schemaData.config.groupAttribute;
    } else {
        accountAttributes = buildAccountAttributesFromMappings(mappings);
        displayAttribute = mappings[0]?.target ?? 'identity';
        identityAttribute = mappings[0]?.target ?? 'identity';
        groupAttribute = entitlementsData?.config.groupAttribute ?? '';
    }

    const commands = resolveCommands(commandsData, entitlementsData, lifecycleData);
    const supportsStateful = statefulData?.config.enabled ?? false;

    const entitlementAttributes: AccountAttribute[] = entitlementsData
        ? entitlementsData.config.attributes.map((a) => ({
              name: a.name,
              type: 'string' as const,
              description: a.description,
              multi: false,
              entitlement: false,
              managed: false,
          }))
        : [];

    const additionalConfig = [
        {
            sectionTitle: 'API Configuration',
            sectionHelpMessage: 'Endpoint and HTTP settings generated from the visual builder canvas',
            items: [
                { key: 'apiEndpoint', label: 'API Endpoint Path', type: 'text' as const, required: true },
                { key: 'httpMethod', label: 'HTTP Method', type: 'text' as const, required: true },
            ],
        },
    ];

    if (lifecycleData) {
        additionalConfig.push({
            sectionTitle: 'Account Lifecycle',
            sectionHelpMessage: 'Endpoints for provisioning operations (use {id} placeholder)',
            items: [
                { key: 'createEndpoint', label: 'Create Endpoint', type: 'text' as const, required: false },
                { key: 'updateEndpoint', label: 'Update Endpoint', type: 'text' as const, required: false },
                { key: 'deleteEndpoint', label: 'Delete Endpoint', type: 'text' as const, required: false },
                { key: 'enableEndpoint', label: 'Enable Endpoint', type: 'text' as const, required: false },
                { key: 'disableEndpoint', label: 'Disable Endpoint', type: 'text' as const, required: false },
                { key: 'unlockEndpoint', label: 'Unlock Endpoint', type: 'text' as const, required: false },
                { key: 'changePasswordEndpoint', label: 'Change Password Endpoint', type: 'text' as const, required: false },
            ],
        });
    }

    if (entitlementsData) {
        additionalConfig.push({
            sectionTitle: 'Entitlements API',
            sectionHelpMessage: 'Settings for entitlement aggregation',
            items: [
                { key: 'entitlementsEndpoint', label: 'Entitlements Endpoint', type: 'text' as const, required: true },
                { key: 'entitlementsMethod', label: 'HTTP Method', type: 'text' as const, required: true },
            ],
        });
    }

    const state: WizardState = {
        connectorName: CONNECTOR_NAME,
        displayName: 'Custom SailPoint Connector',
        description: 'Generated by the SailPoint Visual Connector Builder prototype',
        keyType: 'simple',
        supportsStatefulCommands: supportsStateful,
        authType,
        authConfig: authData ? buildAuthConfig(authData.config) : { apiUrl: baseUrl, keyLabel: 'API Key' },
        commands,
        accountAttributes,
        displayAttribute,
        identityAttribute,
        groupAttribute,
        entitlementAttributes:
            entitlementAttributes.length > 0
                ? entitlementAttributes
                : DEFAULT_ENTITLEMENT_ATTRIBUTES.map((a) => ({ ...a })),
        entitlementDisplayAttribute: entitlementsData?.config.displayAttribute ?? 'name',
        entitlementIdentityAttribute: entitlementsData?.config.identityAttribute ?? 'id',
        accountCreateFields: [],
        additionalConfig,
    };

    return {
        state,
        pipelineOrder,
        apiEndpoint: endpoint.startsWith('http') ? endpoint : `${baseUrl}${apiPath}`,
        apiPath,
        httpMethod: method,
        apiHeaders,
        pagination: paginationData?.config,
        mappings,
        responseParser: parserData?.config,
        entitlements: entitlementsData?.config,
        accountLifecycle: lifecycleData?.config,
        stateful: statefulData?.config,
        authType,
    };
}

export function injectVisualBuilderMetadata(
    indexTs: string,
    mapping: CanvasMappingResult,
): string {
    const header = `// Generated by SailPoint Visual Connector Builder [PROTOTYPE]
// Pipeline order: ${mapping.pipelineOrder.join(' -> ') || 'none'}
// Auth: ${mapping.authType}
// API: ${mapping.httpMethod} ${mapping.apiEndpoint}
// API path: ${mapping.apiPath}
${mapping.pagination ? `// Pagination: ${mapping.pagination.strategy}, pageSize=${mapping.pagination.pageSize}` : ''}
${mapping.responseParser ? `// Response parser: records=[${mapping.responseParser.recordsPath}]` : ''}
${mapping.entitlements ? `// Entitlements: ${mapping.entitlements.method} ${mapping.entitlements.endpoint}` : ''}
${mapping.stateful?.enabled ? `// Stateful aggregation: field=${mapping.stateful.stateField}` : ''}
// Attribute mappings: ${mapping.mappings.map((m) => `${m.source} -> ${m.target}`).join(', ')}
// Enabled commands: ${Object.entries(mapping.state.commands).filter(([, v]) => v).map(([k]) => k).join(', ')}

`;

    return header + indexTs;
}
