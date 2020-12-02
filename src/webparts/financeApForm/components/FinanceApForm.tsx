import * as React from 'react';
import styles from './FinanceApForm.module.scss';
import { escape } from '@microsoft/sp-lodash-subset';

// PnP imports. 
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';

/**
 * Props interface for FinanceApForm component class.
 */
export interface IFinanceApFormProps {
  description: string;
}

/**
 * State interface for FinanceApForm component class.
 */
interface IFinanceApFormState {
  invoices: any; // TODO: Make an invoice interface. 
}

export class FinanceApForm extends React.Component<IFinanceApFormProps, IFinanceApFormState> {
  constructor(props) {
    super(props);

    this.state = {
      invoices: undefined
    };

    this.queryInvoices();
  }

  //#region Private Methods
  private queryInvoices = () => {
    sp.web.lists.getByTitle('Invoices').items.getAll().then(value => {
      this.setState({ invoices: value });
    }).catch(error => {
      console.log('\n\nERROR! Cannot Load Invoices!');
      console.log(error);
      console.log('\n\n');
      this.setState({ invoices: [] });
      alert('Something went wrong! Cannot load Invoices.  Please contact helpdesk@clarington.net');
    });
  }
  //#endregion

  //#region Render Component Methods
  private RenderListView = () => {
    return (
      <div>
        <p>{this.state.invoices.length} Invoices Found!</p>
      </div>
    );
  }
  //#endregion

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      this.state.invoices ? this.RenderListView() : <MyLoadingComponent />
    );
  }
}
