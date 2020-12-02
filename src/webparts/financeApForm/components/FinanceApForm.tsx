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

// Kendo Imports 
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';


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

enum ContentTypes {
  Folder = '0x01200088C42F7CFFB6244DA17EE5E6F15B8D22'
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
    sp.web.lists.getByTitle('Invoices').items.filter(`OData__Status eq 'To Be Paid'`).getAll().then(value => {
      
      // We only want folder objects. 
      value = value.filter(f => f.ContentTypeId === ContentTypes.Folder);

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
  private MyListViewHeader = () => {
    return (
      <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-3 pb-2 pt-2'>
        Invoice list ({this.state.invoices.length})
      </ListViewHeader>
    );
  }

  private MyListViewFooter = () => {
    return (
      <ListViewFooter style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-3 pb-2 pt-2'>
        25 unread messages in total
      </ListViewFooter>
    );
  }

  /**
   * Render an item/row in the list view.
   * @param props List view props.
   */
  private MyListViewItemRender = props => {
    let item = props.dataItem;
    return (
      <div className='row p-2 border-bottom align-middle' style={{ margin: 0 }}>
        <div className='col-sm-2'>hello</div>
        <div className='col-sm-6'>
          <h2 style={{ fontSize: 14, color: '#454545', marginBottom: 0 }} className="text-uppercase">{item.Title}</h2>
          <div style={{ fontSize: 12, color: "#a0a0a0" }}>{item.Vendor_x0020_Name}</div>
        </div>
        <div className='col-sm-4'>
          <div className='k-chip k-chip-filled'>
            <div className='k-chip-content'>{item.OData__Status}</div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the entire list view.
   */
  private RenderListView = () => {
    return (
      <div>
        <ListView
          data={this.state.invoices}
          item={this.MyListViewItemRender}
          style={{ width: "100%" }}
          header={this.MyListViewHeader}
          footer={this.MyListViewFooter}
        />
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
