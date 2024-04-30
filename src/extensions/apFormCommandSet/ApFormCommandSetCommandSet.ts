import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import { MyLists, getSP } from '../../webparts/financeApForm/MyHelperMethods';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import APFormSidePanel, { IAPFormSidePanelProps } from '../../Components/APFormSidePanel';


/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IApFormCommandSetCommandSetProperties {
  // This is an example; replace with your own properties
  sampleTextOne: string;
  sampleTextTwo: string;
}

const LOG_SOURCE: string = 'ApFormCommandSetCommandSet';

export default class ApFormCommandSetCommandSet extends BaseListViewCommandSet<IApFormCommandSetCommandSetProperties> {

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized ApFormCommandSetCommandSet');

    getSP(this.context);

    // initial state of the command's visibility
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);

    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'AP_FORM':
        const AP_FORM_DIV = document.createElement('div');
        const AP_FORM_ELEMENT: React.ReactElement<IAPFormSidePanelProps> = React.createElement(
          APFormSidePanel,
          {
            isOpen: true,
            context: this.context
          }
        );

        ReactDOM.render(AP_FORM_ELEMENT, AP_FORM_DIV);
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');
    debugger;

    const compareOneCommand: Command = this.tryGetCommand('AP_FORM');
    if (compareOneCommand) {
      // This command should be hidden unless 1-100 rows are selected in the Invoices library.
      const v = this.context.listView.selectedRows?.length > 0 && this.context.listView.selectedRows?.length <= 100 && this.context.pageContext.list.title === MyLists.Invoices;
      debugger;
      compareOneCommand.visible = v;
    }

    // TODO: Add your logic here

    // You should call this.raiseOnChage() to update the command bar
    this.raiseOnChange();
  }
}
