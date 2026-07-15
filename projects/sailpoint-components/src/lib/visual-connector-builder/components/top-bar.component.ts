import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectorBuilderStore } from '../services/connector-builder.store';

@Component({
    selector: 'app-builder-top-bar',
    template: `
        <mat-toolbar class="builder-toolbar">
            <mat-icon class="toolbar-icon">hub</mat-icon>
            <span class="toolbar-title">SailPoint Visual Connector Builder</span>
            <span class="prototype-badge">PROTOTYPE</span>
            <span class="toolbar-spacer"></span>
            <button
                mat-flat-button
                class="generate-btn"
                [disabled]="!store.canExport()"
                matTooltip="Generate and download connector ZIP"
                (click)="generateZip.emit()"
            >
                <mat-icon>download</mat-icon>
                Generate Connector ZIP
            </button>
        </mat-toolbar>
    `,
    styles: [
        `
            .builder-toolbar {
                background: linear-gradient(90deg, #312e81 0%, #4338ca 50%, #4f46e5 100%);
                color: #fff;
                height: 56px;
                padding: 0 20px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .toolbar-icon {
                margin-right: 10px;
            }

            .toolbar-title {
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.02em;
            }

            .prototype-badge {
                margin-left: 12px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.1em;
                padding: 3px 8px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.25);
            }

            .toolbar-spacer {
                flex: 1;
            }

            .generate-btn {
                background: #fff !important;
                color: #4338ca !important;
                font-weight: 600;
                letter-spacing: 0.02em;
            }

            .generate-btn:disabled {
                background: rgba(255, 255, 255, 0.3) !important;
                color: rgba(255, 255, 255, 0.6) !important;
            }

            .generate-btn mat-icon {
                margin-right: 6px;
            }
        `,
    ],
    imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderTopBarComponent {
    readonly store = inject(ConnectorBuilderStore);
    readonly generateZip = output<void>();
}
