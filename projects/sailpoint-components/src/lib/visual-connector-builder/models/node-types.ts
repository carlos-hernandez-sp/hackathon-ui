import { AttributeType, AuthType, CommandSelection } from '../../saas-connectivity-creator/saas-connectivity-creator.models';

export type ConnectorNodeType =
    | 'authentication'
    | 'api-request'
    | 'response-parser'
    | 'pagination'
    | 'data-transform'
    | 'account-schema'
    | 'commands'
    | 'entitlements'
    | 'account-lifecycle'
    | 'stateful-aggregation';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiRequestConfig {
    method: HttpMethod;
    endpoint: string;
    headers: { key: string; value: string }[];
}

export interface AttributeMapping {
    source: string;
    target: string;
}

export interface DataTransformConfig {
    mappings: AttributeMapping[];
}

export type PaginationStrategy = 'offset' | 'cursor';

export interface PaginationConfig {
    strategy: PaginationStrategy;
    pageSize: number;
}

export interface AuthenticationConfig {
    authType: AuthType;
    apiUrl: string;
    keyLabel: string;
    tokenLabel: string;
    usernameLabel: string;
    passwordLabel: string;
    tokenUrl: string;
    scopes: string;
}

export interface ResponseParserConfig {
    recordsPath: string;
    cursorPath: string;
    entitlementsPath: string;
}

export interface SchemaAttribute {
    name: string;
    type: AttributeType;
    description: string;
    multi: boolean;
    entitlement: boolean;
    managed: boolean;
}

export interface AccountSchemaConfig {
    displayAttribute: string;
    identityAttribute: string;
    groupAttribute: string;
    attributes: SchemaAttribute[];
}

export type CommandsConfig = CommandSelection;

export interface EntitlementAttribute {
    name: string;
    description: string;
}

export interface EntitlementsConfig {
    endpoint: string;
    method: HttpMethod;
    groupAttribute: string;
    displayAttribute: string;
    identityAttribute: string;
    attributes: EntitlementAttribute[];
}

export interface AccountLifecycleConfig {
    createEndpoint: string;
    updateEndpoint: string;
    deleteEndpoint: string;
    enableEndpoint: string;
    disableEndpoint: string;
    unlockEndpoint: string;
    changePasswordEndpoint: string;
}

export interface StatefulAggregationConfig {
    enabled: boolean;
    stateField: string;
}

export interface AuthenticationNodeData {
    nodeType: 'authentication';
    config: AuthenticationConfig;
}

export interface ApiRequestNodeData {
    nodeType: 'api-request';
    config: ApiRequestConfig;
}

export interface ResponseParserNodeData {
    nodeType: 'response-parser';
    config: ResponseParserConfig;
}

export interface DataTransformNodeData {
    nodeType: 'data-transform';
    config: DataTransformConfig;
}

export interface PaginationNodeData {
    nodeType: 'pagination';
    config: PaginationConfig;
}

export interface AccountSchemaNodeData {
    nodeType: 'account-schema';
    config: AccountSchemaConfig;
}

export interface CommandsNodeData {
    nodeType: 'commands';
    config: CommandsConfig;
}

export interface EntitlementsNodeData {
    nodeType: 'entitlements';
    config: EntitlementsConfig;
}

export interface AccountLifecycleNodeData {
    nodeType: 'account-lifecycle';
    config: AccountLifecycleConfig;
}

export interface StatefulAggregationNodeData {
    nodeType: 'stateful-aggregation';
    config: StatefulAggregationConfig;
}

export type ConnectorNodeData =
    | AuthenticationNodeData
    | ApiRequestNodeData
    | ResponseParserNodeData
    | DataTransformNodeData
    | PaginationNodeData
    | AccountSchemaNodeData
    | CommandsNodeData
    | EntitlementsNodeData
    | AccountLifecycleNodeData
    | StatefulAggregationNodeData;

export const DEFAULT_AUTHENTICATION_CONFIG: AuthenticationConfig = {
    authType: 'apiKey',
    apiUrl: 'https://api.example.com',
    keyLabel: 'API Key',
    tokenLabel: 'Bearer Token',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    tokenUrl: 'https://api.example.com/oauth/token',
    scopes: '',
};

export const DEFAULT_API_REQUEST_CONFIG: ApiRequestConfig = {
    method: 'GET',
    endpoint: '/users',
    headers: [],
};

export const DEFAULT_RESPONSE_PARSER_CONFIG: ResponseParserConfig = {
    recordsPath: 'data,items,results,records,users,accounts',
    cursorPath: 'nextCursor,next_cursor,next,cursor',
    entitlementsPath: 'data,items,groups,entitlements',
};

export const DEFAULT_DATA_TRANSFORM_CONFIG: DataTransformConfig = {
    mappings: [{ source: 'id', target: 'identity' }],
};

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
    strategy: 'offset',
    pageSize: 100,
};

export const DEFAULT_ACCOUNT_SCHEMA_CONFIG: AccountSchemaConfig = {
    displayAttribute: 'displayName',
    identityAttribute: 'identity',
    groupAttribute: 'entitlements',
    attributes: [
        { name: 'identity', type: 'string', description: 'Unique account identifier', multi: false, entitlement: false, managed: false },
        { name: 'displayName', type: 'string', description: 'Display name of the account', multi: false, entitlement: false, managed: false },
        { name: 'email', type: 'string', description: 'Email address', multi: false, entitlement: false, managed: false },
    ],
};

export const DEFAULT_COMMANDS_CONFIG: CommandsConfig = {
    testConnection: true,
    accountList: true,
    accountRead: true,
    accountCreate: false,
    accountUpdate: false,
    accountDelete: false,
    accountEnable: false,
    accountDisable: false,
    accountUnlock: false,
    changePassword: false,
    entitlementList: false,
    entitlementRead: false,
    sourceDataDiscover: false,
    sourceDataRead: false,
};

export const DEFAULT_ENTITLEMENTS_CONFIG: EntitlementsConfig = {
    endpoint: '/groups',
    method: 'GET',
    groupAttribute: 'entitlements',
    displayAttribute: 'name',
    identityAttribute: 'id',
    attributes: [
        { name: 'id', description: 'Unique group identifier' },
        { name: 'name', description: 'Display name of the group' },
    ],
};

export const DEFAULT_ACCOUNT_LIFECYCLE_CONFIG: AccountLifecycleConfig = {
    createEndpoint: '/users',
    updateEndpoint: '/users/{id}',
    deleteEndpoint: '/users/{id}',
    enableEndpoint: '/users/{id}/enable',
    disableEndpoint: '/users/{id}/disable',
    unlockEndpoint: '/users/{id}/unlock',
    changePasswordEndpoint: '/users/{id}/password',
};

export const DEFAULT_STATEFUL_AGGREGATION_CONFIG: StatefulAggregationConfig = {
    enabled: false,
    stateField: 'updatedAt',
};

export function createDefaultNodeData(type: ConnectorNodeType): ConnectorNodeData {
    switch (type) {
        case 'authentication':
            return { nodeType: 'authentication', config: { ...DEFAULT_AUTHENTICATION_CONFIG } };
        case 'api-request':
            return { nodeType: 'api-request', config: { ...DEFAULT_API_REQUEST_CONFIG, headers: [] } };
        case 'response-parser':
            return { nodeType: 'response-parser', config: { ...DEFAULT_RESPONSE_PARSER_CONFIG } };
        case 'data-transform':
            return {
                nodeType: 'data-transform',
                config: { mappings: DEFAULT_DATA_TRANSFORM_CONFIG.mappings.map((m) => ({ ...m })) },
            };
        case 'pagination':
            return { nodeType: 'pagination', config: { ...DEFAULT_PAGINATION_CONFIG } };
        case 'account-schema':
            return {
                nodeType: 'account-schema',
                config: {
                    ...DEFAULT_ACCOUNT_SCHEMA_CONFIG,
                    attributes: DEFAULT_ACCOUNT_SCHEMA_CONFIG.attributes.map((a) => ({ ...a })),
                },
            };
        case 'commands':
            return { nodeType: 'commands', config: { ...DEFAULT_COMMANDS_CONFIG } };
        case 'entitlements':
            return {
                nodeType: 'entitlements',
                config: {
                    ...DEFAULT_ENTITLEMENTS_CONFIG,
                    attributes: DEFAULT_ENTITLEMENTS_CONFIG.attributes.map((a) => ({ ...a })),
                },
            };
        case 'account-lifecycle':
            return { nodeType: 'account-lifecycle', config: { ...DEFAULT_ACCOUNT_LIFECYCLE_CONFIG } };
        case 'stateful-aggregation':
            return { nodeType: 'stateful-aggregation', config: { ...DEFAULT_STATEFUL_AGGREGATION_CONFIG } };
    }
}

export function truncateEndpoint(endpoint: string, maxLength = 24): string {
    if (!endpoint) {
        return 'No endpoint set';
    }
    if (endpoint.length <= maxLength) {
        return endpoint;
    }
    return `${endpoint.slice(0, maxLength)}...`;
}

export const AUTH_TYPE_LABELS: Record<AuthType, string> = {
    apiKey: 'API Key',
    oauth2: 'OAuth 2.0',
    basicAuth: 'Basic Auth',
    bearerToken: 'Bearer Token',
    custom: 'Custom',
};
