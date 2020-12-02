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

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      <div className={styles.financeApForm}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <span className={styles.title}>Welcome to SharePoint!</span>
              {this.state.invoices ? <p className={styles.subTitle}>{this.state.invoices.length} Invoices found.</p> : <p>... loading ...</p>}
              <p className={styles.description}>{escape(this.props.description)}</p>
              <a href="https://aka.ms/spfx" className={styles.button}>
                <span className={styles.label}>Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
