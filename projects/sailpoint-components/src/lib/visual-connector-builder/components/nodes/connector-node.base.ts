import { Directive, inject } from '@angular/core';
import { CustomNodeComponent } from 'ngx-vflow';
import { ConnectorBuilderStore } from '../../services/connector-builder.store';

/**
 * Base for canvas node components. ngx-vflow component nodes do not call
 * selectNode() on click (unlike default nodes), so we select on mousedown
 * to keep the properties panel in sync before drag starts.
 */
@Directive()
export abstract class ConnectorNodeBase<T> extends CustomNodeComponent<T> {
    protected readonly builderStore = inject(ConnectorBuilderStore);

    selectThisNode(_event: MouseEvent): void {
        this.builderStore.selectNode(this.node().id);
    }
}
