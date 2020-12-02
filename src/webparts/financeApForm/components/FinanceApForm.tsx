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
import { Card, CardTitle, CardHeader, CardImage, CardBody, CardSubtitle, CardActions } from '@progress/kendo-react-layout';
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
  // The invoices that we want to render
  visibleInvoices: any; // TODO: Make an invoice interface. 

  // Invoices that we're queries but do not want to render yet. 
  availableInvoices: any;

  // The invoices that we have queried.
  allInvoices: any;
}

enum ContentTypes {
  Folder = '0x01200088C42F7CFFB6244DA17EE5E6F15B8D22'
}

export class FinanceApForm extends React.Component<IFinanceApFormProps, IFinanceApFormState> {
  constructor(props) {
    super(props);

    this.state = {
      visibleInvoices: undefined,
      allInvoices: undefined,
      availableInvoices: undefined
    };


    this.queryInvoices();
  }

  //#region Private Methods
  private queryInvoices = () => {
    console.log('Query Invoices');
    sp.web.lists.getByTitle('Invoices').items.filter(`OData__Status eq 'To Be Paid'`).getAll().then(value => {

      // We only want folder objects. 
      value = value.filter(f => f.ContentTypeId === ContentTypes.Folder);

      // Create a new instance of this object.
      let invoiceHolder = value.slice(0);

      this.setState({
        visibleInvoices: invoiceHolder.splice(0, this.TAKE_N),
        availableInvoices: invoiceHolder,
        allInvoices: value
      });
    }).catch(error => {
      console.log('\n\nERROR! Cannot Load Invoices!');
      console.log(error);
      console.log('\n\n');
      this.setState({ visibleInvoices: [], allInvoices: [] });
      alert('Something went wrong! Cannot load Invoices.  Please contact helpdesk@clarington.net');
    });
  }
  //#endregion

  //#region ListView Events
  public scrollHandler = event => {
    console.log('scrollHandler');
    const e = event.nativeEvent;
    if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight) {
      const moreData = this.state.availableInvoices.splice(0, this.TAKE_N);
      if (moreData.length > 0) {
        this.setState({ visibleInvoices: this.state.visibleInvoices.concat(moreData) });
      }
    }
  }
  //#endregion

  //#region Render Component Methods
  private MyListViewHeader = () => {
    return (
      <ListViewHeader style={{ color: 'rgb(160, 160, 160)', fontSize: 14 }} className='pl-3 pb-2 pt-2'>
        Invoices {this.state.visibleInvoices.length}/{this.state.allInvoices.length}
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
      <Card style={{ marginBottom: '10px', marginLeft: '2px', marginRight: '2px' }}>
        <CardHeader>
          <div className='row'>
            <div className='col-xs-8 col-sm-10 col-md-10'>
              <CardTitle><span title='Vendor Name'>{item.Vendor_x0020_Name}</span> | <span title='Vendor ID'>{item.Vendor_x0020_Number}</span></CardTitle>
            </div>
            <div className='col-xs-4 col-sm-2 col-md-2'>
              <div className='k-chip k-chip-filled'>
                <div className='k-chip-content'>{item.OData__Status}</div>
              </div>
            </div>
          </div>
          <CardSubtitle>
            <span title='Invoice Number'>{item.Invoice_x0020_Number}</span> | <span title='Invoice Title'>{item.Title}</span> | <span title='Invoice Type'>{item.Invoice_x0020_Type}</span>
          </CardSubtitle>
        </CardHeader>
        <CardBody>
          <div className='row'>
            <div className='col-xs-10 col-sm-10'>body</div>
            <div className='col-xs-2 col-sm-2'>edit</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  /**
   * Render the entire list view.
   */
  private RenderListView = () => {
    return (
      <div>
        <ListView
          onScroll={this.scrollHandler}
          data={this.state.visibleInvoices}
          item={this.MyListViewItemRender}
          style={{ width: "100%", height: 530 }}
          header={this.MyListViewHeader}
          footer={this.MyListViewFooter}
        />
      </div>
    );
  }
  //#endregion

  private TAKE_N = 50;

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      this.state.visibleInvoices ? this.RenderListView() : <MyLoadingComponent />
    );
  }
}
