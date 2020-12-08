import * as React from 'react';
import styles from './FinanceApForm.module.scss';
import { escape } from '@microsoft/sp-lodash-subset';
import Moment from 'react-moment';

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
import { Button } from '@progress/kendo-react-buttons';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Label, Error } from '@progress/kendo-react-labels';
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';


// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';
import { IInvoice } from '../interfaces/IInvoice';
import { values } from 'office-ui-fabric-react/lib/Utilities';
import { APItemComponent } from './APItemComponent';
import * as MyHelper from '../MyHelperMethods';


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

  departments?: any;
  invoiceTypes?: string[];
  invoiceStatus?: string[];
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
    this.queryDepartments();
    this.queryInvoiceTypes();
    this.queryInvoiceStatus();
  }

  //#region CONSTS (Kinda)
  private TAKE_N = 25;
  //#endregion

  //#region Private Methods
  private queryInvoices = () => {
    console.log('Query Invoices');
    sp.web.lists.getByTitle('Invoices').items.filter(`OData__Status eq 'To Be Paid'`)
      .select(`*, 
      Department/Title, 
      Received_x0020_Approval_x0020_From/Id, 
      Received_x0020_Approval_x0020_From/Title, 
      Received_x0020_Approval_x0020_From/EMail,
      Requires_x0020_Approval_x0020_From/Id, 
      Requires_x0020_Approval_x0020_From/Title, 
      Requires_x0020_Approval_x0020_From/EMail
      `)
      .expand('Department,Received_x0020_Approval_x0020_From,Requires_x0020_Approval_x0020_From')
      .getAll().then(value => {
        // We only want folder objects. 
        value = value.filter(f => f.ContentTypeId === ContentTypes.Folder);
        value = value.map(v => {
          return {
            ...v,
            Invoice_x0020_Date: new Date(v.Invoice_x0020_Date),
            Received_x0020_Date: new Date(v.Received_x0020_Date)
          };
        });

        // Create a new instance of this object.
        let invoiceHolder = value.slice(0);

        this.setState({
          visibleInvoices: invoiceHolder.splice(0, this.TAKE_N),
          availableInvoices: invoiceHolder,
          allInvoices: value
        });

        this.queryAccountForInvoices(this.state.visibleInvoices);

      }).catch(error => {
        console.log('\n\nERROR! Cannot Load Invoices!');
        console.log(error);
        console.log('\n\n');
        this.setState({ visibleInvoices: [], allInvoices: [] });
        alert('Something went wrong! Cannot load Invoices.  Please contact helpdesk@clarington.net');
      });
  }

  private queryDepartments = async () => {
    sp.web.lists.getByTitle('Departments').items.select('Title, ID').getAll().then(value => {
      this.setState({
        departments: value
      });
    });
  }

  private queryInvoiceTypes = async () => {
    sp.web.lists.getByTitle('Invoices').fields.getByTitle('Invoice Type').select('Choices').get().then((value: any) => {
      this.setState({
        invoiceTypes: value.Choices
      });
    });
  }

  private queryInvoiceStatus = async () => {
    sp.web.lists.getByTitle('Invoices').fields.getByTitle('Status').select('Choices').get().then((value: any) => {
      this.setState({
        invoiceStatus: value.Choices
      });
    });
  }

  /**
   * 
   * @param visibleInvoices The invoices that have been rendered. 
   */
  private queryAccountForInvoices = async (visibleInvoices: IInvoice[]) => {
    let accountList = sp.web.lists.getById('dc5b951f-f68d-42c4-9371-c5515fcf1cab');

    for (let index = 0; index < visibleInvoices.length; index++) {
      const invoice = visibleInvoices[index];

      let accounts = await accountList.items.filter(`InvoiceFolderID eq ${invoice.ID}`).select('ID, Title, AmountIncludingTaxes').get();

      let visibleInvoicesState: IInvoice[] = this.state.visibleInvoices;

      let indexOfVisibleInvoice: number = visibleInvoicesState.findIndex(f => f.ID === invoice.ID);

      if (indexOfVisibleInvoice >= 0) {
        // If no accounts were found this will be an empty array. 
        visibleInvoicesState[indexOfVisibleInvoice].Accounts = [...accounts];
        this.setState({
          visibleInvoices: [...visibleInvoicesState]
        });
      }
    }
  }
  //#endregion

  //#region ListView Events
  public scrollHandler = event => {
    console.log('scrollHandler');
    console.log(event);
    const e = event.nativeEvent;
    if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight) {
      const moreData = this.state.availableInvoices.splice(0, this.TAKE_N);
      if (moreData.length > 0) {
        this.setState({ visibleInvoices: this.state.visibleInvoices.concat(moreData) });
        this.queryAccountForInvoices(moreData);
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

  private APItemComponentRender = props => <APItemComponent {...props} departments={this.state.departments} invoiceTypes={this.state.invoiceTypes} invoiceStatus={this.state.invoiceStatus} />;

  private RenderListView = () => {
    return (
      <div>
        <ListView
          onScroll={this.scrollHandler}
          data={this.state.visibleInvoices}
          item={this.APItemComponentRender}
          style={{ width: "100%", height: 780 }}
          header={this.MyListViewHeader}
          footer={this.MyListViewFooter}
        />
      </div>
    );
  }
  //#endregion

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      this.state.visibleInvoices ? this.RenderListView() : <MyLoadingComponent />
    );
  }
}
