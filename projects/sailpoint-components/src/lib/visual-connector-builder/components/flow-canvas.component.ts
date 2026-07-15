import {
    afterNextRender,
    Component,
    DestroyRef,
    HostListener,
    inject,
    viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Connection, Vflow, VflowComponent } from 'ngx-vflow';
import { ConnectorNodeType } from '../models/node-types';
import { ConnectorBuilderStore } from '../services/connector-builder.store';

@Component({
    selector: 'app-flow-canvas',
    template: `
        <div
            class="canvas-container"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
        >
            <vflow
                #vflow
                view="auto"
                [nodes]="store.vflowNodes()"
                [edges]="store.vflowEdges()"
                [snapGrid]="[20, 20]"
                [background]="gridBackground"
                [entitiesSelectable]="true"
                [keyboardShortcuts]="{ multiSelection: null }"
                (connect)="onConnect($event)"
            />
            @if (!store.hasNodes()) {
                <div class="canvas-hint">
                    <p>Drag nodes from the palette or click to add them here</p>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .canvas-container {
                position: relative;
                width: 100%;
                height: 100%;
                min-height: 0;
            }

            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            vflow {
                width: 100%;
                height: 100%;
            }

            .canvas-hint {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                text-align: center;
                color: #475569;
                font-size: 14px;
            }

            .canvas-hint p {
                margin: 0;
                padding: 16px 24px;
                border: 1px dashed #334155;
                border-radius: 8px;
                background: rgba(15, 23, 42, 0.6);
            }
        `,
    ],
    imports: [Vflow],
})
export class FlowCanvasComponent {
    readonly store = inject(ConnectorBuilderStore);
    private readonly destroyRef = inject(DestroyRef);

    readonly gridBackground = {
        type: 'grid' as const,
        size: 20,
        color: '#1e293b',
        strokeWidth: 1,
        backgroundColor: '#0f172a',
    };

    private readonly vflowRef = viewChild<VflowComponent>('vflow');

    constructor() {
        afterNextRender(() => {
            const vflow = this.vflowRef();
            if (vflow) {
                vflow.nodesChange$
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((changes) => this.store.handleNodeChanges(changes));
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Backspace' || event.key === 'Delete') {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            event.preventDefault();
            this.store.removeSelectedNode();
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        const nodeType = event.dataTransfer?.getData('application/connector-node') as ConnectorNodeType;
        if (!nodeType) {
            return;
        }

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.clientX - rect.left - 100;
        const y = event.clientY - rect.top - 40;
        this.store.addNode(nodeType, { x: Math.max(20, x), y: Math.max(20, y) });
    }

    onConnect(connection: Connection): void {
        this.store.addEdge(connection.source, connection.target);
    }
}
