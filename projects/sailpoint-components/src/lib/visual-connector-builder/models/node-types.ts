export type ConnectorNodeType = 'api-request' | 'data-transform' | 'pagination';

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

export interface ApiRequestNodeData {
    nodeType: 'api-request';
    config: ApiRequestConfig;
}

export interface DataTransformNodeData {
    nodeType: 'data-transform';
    config: DataTransformConfig;
}

export interface PaginationNodeData {
    nodeType: 'pagination';
    config: PaginationConfig;
}

export type ConnectorNodeData = ApiRequestNodeData | DataTransformNodeData | PaginationNodeData;

export const DEFAULT_API_REQUEST_CONFIG: ApiRequestConfig = {
    method: 'GET',
    endpoint: '',
    headers: [],
};

export const DEFAULT_DATA_TRANSFORM_CONFIG: DataTransformConfig = {
    mappings: [{ source: 'id', target: 'identity' }],
};

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
    strategy: 'offset',
    pageSize: 100,
};

export function createDefaultNodeData(type: ConnectorNodeType): ConnectorNodeData {
    switch (type) {
        case 'api-request':
            return { nodeType: 'api-request', config: { ...DEFAULT_API_REQUEST_CONFIG } };
        case 'data-transform':
            return {
                nodeType: 'data-transform',
                config: {
                    mappings: DEFAULT_DATA_TRANSFORM_CONFIG.mappings.map((m) => ({ ...m })),
                },
            };
        case 'pagination':
            return { nodeType: 'pagination', config: { ...DEFAULT_PAGINATION_CONFIG } };
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
