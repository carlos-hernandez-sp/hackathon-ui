import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { ConnectorCodeGenerator } from '../../saas-connectivity-creator/saas-connectivity-creator.generator';
import { ConnectorBuilderStore } from './connector-builder.store';
import {
    injectVisualBuilderMetadata,
    mapCanvasToWizardState,
} from '../utils/canvas-to-wizard-state.mapper';
import {
    generateConfigExample,
    generateVisualConnectorClient,
} from '../utils/visual-connector-client.generator';

export const ZIP_FILENAME = 'custom-sailpoint-connector.zip';

@Injectable()
export class ConnectorExportService {
    constructor(private readonly store: ConnectorBuilderStore) {}

    async downloadConnectorZip(): Promise<{ success: boolean; message: string }> {
        if (!this.store.canExport()) {
            return {
                success: false,
                message: 'Add at least one node to the canvas before exporting.',
            };
        }

        const snapshot = this.store.getSnapshot();
        const mapping = mapCanvasToWizardState(snapshot);
        const state = mapping.state;

        const zip = new JSZip();
        const folder = zip.folder(state.connectorName)!;

        folder.file('connector-spec.json', ConnectorCodeGenerator.generateConnectorSpec(state));
        folder.file('package.json', ConnectorCodeGenerator.generatePackageJson(state));
        folder.file('tsconfig.json', ConnectorCodeGenerator.generateTsConfig());
        folder.file('.gitignore', ConnectorCodeGenerator.generateGitIgnore());
        folder.file('config.json.example', generateConfigExample(mapping));

        const src = folder.folder('src')!;
        const indexTs = injectVisualBuilderMetadata(
            ConnectorCodeGenerator.generateIndexTs(state),
            mapping,
        );
        src.file('index.ts', indexTs);
        src.file(`${state.connectorName}-client.ts`, generateVisualConnectorClient(mapping));

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = ZIP_FILENAME;
        anchor.click();
        URL.revokeObjectURL(url);

        return { success: true, message: 'Connector ZIP downloaded successfully.' };
    }
}
