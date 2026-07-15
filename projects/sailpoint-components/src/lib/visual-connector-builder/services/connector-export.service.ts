import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { ConnectorCodeGenerator } from '../../saas-connectivity-creator/saas-connectivity-creator.generator';
import { ConnectorBuilderStore } from './connector-builder.store';
import {
    injectVisualBuilderMetadata,
    mapCanvasToWizardState,
} from '../utils/canvas-to-wizard-state.mapper';

export const ZIP_FILENAME = 'custom-sailpoint-connector.zip';

@Injectable()
export class ConnectorExportService {
    constructor(private readonly store: ConnectorBuilderStore) {}

    async downloadConnectorZip(): Promise<{ success: boolean; message: string }> {
        if (!this.store.canExport()) {
            return {
                success: false,
                message: 'Configure at least one API Request node with an endpoint before exporting.',
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

        const src = folder.folder('src')!;
        const indexTs = injectVisualBuilderMetadata(
            ConnectorCodeGenerator.generateIndexTs(state),
            mapping,
        );
        src.file('index.ts', indexTs);
        src.file(`${state.connectorName}-client.ts`, ConnectorCodeGenerator.generateClientTs(state));

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
