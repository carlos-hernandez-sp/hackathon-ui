import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BuilderTopBarComponent } from './components/top-bar.component';
import { FlowCanvasComponent } from './components/flow-canvas.component';
import { NodePaletteComponent } from './components/node-palette.component';
import { PropertiesPanelComponent } from './components/properties-panel.component';
import { ConnectorBuilderStore } from './services/connector-builder.store';
import { ConnectorExportService } from './services/connector-export.service';

@Component({
    selector: 'app-visual-connector-builder',
    templateUrl: './visual-connector-builder.component.html',
    styleUrl: './visual-connector-builder.component.scss',
    imports: [
        BuilderTopBarComponent,
        NodePaletteComponent,
        FlowCanvasComponent,
        PropertiesPanelComponent,
        MatSnackBarModule,
    ],
    providers: [ConnectorBuilderStore, ConnectorExportService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualConnectorBuilderComponent {
    private readonly exportService = inject(ConnectorExportService);
    private readonly snackBar = inject(MatSnackBar);

    async onGenerateZip(): Promise<void> {
        const result = await this.exportService.downloadConnectorZip();
        this.snackBar.open(result.message, 'Close', {
            duration: result.success ? 4000 : 6000,
            panelClass: result.success ? 'snack-success' : 'snack-error',
        });
    }
}
