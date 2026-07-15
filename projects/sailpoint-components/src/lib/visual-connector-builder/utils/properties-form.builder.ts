import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthType } from '../../saas-connectivity-creator/saas-connectivity-creator.models';
import {
    AccountLifecycleNodeData,
    AccountSchemaNodeData,
    ApiRequestNodeData,
    AuthenticationNodeData,
    CommandsNodeData,
    ConnectorNodeData,
    DataTransformNodeData,
    EntitlementsNodeData,
    HttpMethod,
    PaginationNodeData,
    PaginationStrategy,
    ResponseParserNodeData,
    StatefulAggregationNodeData,
} from '../models/node-types';
import { ConnectorBuilderStore } from '../services/connector-builder.store';

export function buildNodeForm(fb: FormBuilder, data: ConnectorNodeData): FormGroup {
    switch (data.nodeType) {
        case 'authentication':
            return fb.group({
                authType: [data.config.authType],
                apiUrl: [data.config.apiUrl],
                keyLabel: [data.config.keyLabel],
                tokenLabel: [data.config.tokenLabel],
                usernameLabel: [data.config.usernameLabel],
                passwordLabel: [data.config.passwordLabel],
                tokenUrl: [data.config.tokenUrl],
                scopes: [data.config.scopes],
            });
        case 'api-request':
            return fb.group({
                method: [data.config.method],
                endpoint: [data.config.endpoint],
                headers: fb.array(
                    data.config.headers.map((h) => fb.group({ key: [h.key], value: [h.value] })),
                ),
            });
        case 'response-parser':
            return fb.group({
                recordsPath: [data.config.recordsPath],
                cursorPath: [data.config.cursorPath],
                entitlementsPath: [data.config.entitlementsPath],
            });
        case 'data-transform':
            return fb.group({
                mappings: fb.array(
                    data.config.mappings.map((m) =>
                        fb.group({
                            source: [m.source, Validators.required],
                            target: [m.target, Validators.required],
                        }),
                    ),
                ),
            });
        case 'pagination':
            return fb.group({
                strategy: [data.config.strategy],
                pageSize: [data.config.pageSize, [Validators.required, Validators.min(1)]],
            });
        case 'account-schema':
            return fb.group({
                displayAttribute: [data.config.displayAttribute],
                identityAttribute: [data.config.identityAttribute],
                groupAttribute: [data.config.groupAttribute],
                attributes: fb.array(
                    data.config.attributes.map((a) =>
                        fb.group({
                            name: [a.name, Validators.required],
                            type: [a.type],
                            description: [a.description],
                            multi: [a.multi],
                            entitlement: [a.entitlement],
                            managed: [a.managed],
                        }),
                    ),
                ),
            });
        case 'commands':
            return fb.group({
                testConnection: [data.config.testConnection],
                accountList: [data.config.accountList],
                accountRead: [data.config.accountRead],
                accountCreate: [data.config.accountCreate],
                accountUpdate: [data.config.accountUpdate],
                accountDelete: [data.config.accountDelete],
                accountEnable: [data.config.accountEnable],
                accountDisable: [data.config.accountDisable],
                accountUnlock: [data.config.accountUnlock],
                changePassword: [data.config.changePassword],
                entitlementList: [data.config.entitlementList],
                entitlementRead: [data.config.entitlementRead],
                sourceDataDiscover: [data.config.sourceDataDiscover],
                sourceDataRead: [data.config.sourceDataRead],
            });
        case 'entitlements':
            return fb.group({
                endpoint: [data.config.endpoint],
                method: [data.config.method],
                groupAttribute: [data.config.groupAttribute],
                displayAttribute: [data.config.displayAttribute],
                identityAttribute: [data.config.identityAttribute],
                attributes: fb.array(
                    data.config.attributes.map((a) =>
                        fb.group({
                            name: [a.name, Validators.required],
                            description: [a.description],
                        }),
                    ),
                ),
            });
        case 'account-lifecycle':
            return fb.group({
                createEndpoint: [data.config.createEndpoint],
                updateEndpoint: [data.config.updateEndpoint],
                deleteEndpoint: [data.config.deleteEndpoint],
                enableEndpoint: [data.config.enableEndpoint],
                disableEndpoint: [data.config.disableEndpoint],
                unlockEndpoint: [data.config.unlockEndpoint],
                changePasswordEndpoint: [data.config.changePasswordEndpoint],
            });
        case 'stateful-aggregation':
            return fb.group({
                enabled: [data.config.enabled],
                stateField: [data.config.stateField],
            });
    }
}

export function syncNodeFormToStore(
    store: ConnectorBuilderStore,
    nodeId: string,
    nodeType: ConnectorNodeData['nodeType'],
    form: FormGroup,
): void {
    const value = form.getRawValue();

    switch (nodeType) {
        case 'authentication': {
            const updated: AuthenticationNodeData = {
                nodeType: 'authentication',
                config: {
                    authType: value.authType as AuthType,
                    apiUrl: value.apiUrl ?? '',
                    keyLabel: value.keyLabel ?? 'API Key',
                    tokenLabel: value.tokenLabel ?? 'Bearer Token',
                    usernameLabel: value.usernameLabel ?? 'Username',
                    passwordLabel: value.passwordLabel ?? 'Password',
                    tokenUrl: value.tokenUrl ?? '',
                    scopes: value.scopes ?? '',
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'api-request': {
            const updated: ApiRequestNodeData = {
                nodeType: 'api-request',
                config: {
                    method: value.method as HttpMethod,
                    endpoint: value.endpoint ?? '',
                    headers: (value.headers ?? []).filter(
                        (h: { key: string; value: string }) => h.key || h.value,
                    ),
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'response-parser': {
            const updated: ResponseParserNodeData = {
                nodeType: 'response-parser',
                config: {
                    recordsPath: value.recordsPath ?? 'data',
                    cursorPath: value.cursorPath ?? 'nextCursor',
                    entitlementsPath: value.entitlementsPath ?? 'data',
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'data-transform': {
            const updated: DataTransformNodeData = {
                nodeType: 'data-transform',
                config: {
                    mappings: (value.mappings ?? []).filter(
                        (m: { source: string; target: string }) => m.source && m.target,
                    ),
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'pagination': {
            const updated: PaginationNodeData = {
                nodeType: 'pagination',
                config: {
                    strategy: value.strategy as PaginationStrategy,
                    pageSize: Number(value.pageSize) || 100,
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'account-schema': {
            const updated: AccountSchemaNodeData = {
                nodeType: 'account-schema',
                config: {
                    displayAttribute: value.displayAttribute ?? 'displayName',
                    identityAttribute: value.identityAttribute ?? 'identity',
                    groupAttribute: value.groupAttribute ?? '',
                    attributes: (value.attributes ?? []).filter(
                        (a: { name: string }) => a.name,
                    ),
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'commands': {
            const updated: CommandsNodeData = {
                nodeType: 'commands',
                config: { ...value },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'entitlements': {
            const updated: EntitlementsNodeData = {
                nodeType: 'entitlements',
                config: {
                    endpoint: value.endpoint ?? '/groups',
                    method: value.method as HttpMethod,
                    groupAttribute: value.groupAttribute ?? 'entitlements',
                    displayAttribute: value.displayAttribute ?? 'name',
                    identityAttribute: value.identityAttribute ?? 'id',
                    attributes: (value.attributes ?? []).filter(
                        (a: { name: string }) => a.name,
                    ),
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'account-lifecycle': {
            const updated: AccountLifecycleNodeData = {
                nodeType: 'account-lifecycle',
                config: {
                    createEndpoint: value.createEndpoint ?? '',
                    updateEndpoint: value.updateEndpoint ?? '',
                    deleteEndpoint: value.deleteEndpoint ?? '',
                    enableEndpoint: value.enableEndpoint ?? '',
                    disableEndpoint: value.disableEndpoint ?? '',
                    unlockEndpoint: value.unlockEndpoint ?? '',
                    changePasswordEndpoint: value.changePasswordEndpoint ?? '',
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
        case 'stateful-aggregation': {
            const updated: StatefulAggregationNodeData = {
                nodeType: 'stateful-aggregation',
                config: {
                    enabled: !!value.enabled,
                    stateField: value.stateField ?? 'updatedAt',
                },
            };
            store.updateNodeData(nodeId, updated);
            break;
        }
    }
}
