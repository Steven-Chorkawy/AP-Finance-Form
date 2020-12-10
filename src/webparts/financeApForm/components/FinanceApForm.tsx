import * as React from 'react';

// PnP imports. 
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

// Kendo Imports 
import { ListView, ListViewHeader, ListViewFooter, ListViewEvent } from '@progress/kendo-react-listview';
import { Input, InputChangeEvent, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList, DropDownListChangeEvent, MultiSelect } from '@progress/kendo-react-dropdowns';
import { filterBy } from '@progress/kendo-data-query';

// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';
import { IInvoice } from '../interfaces/IInvoice';
import { APItemComponent } from './APItemComponent';
import * as MyHelper from '../MyHelperMethods';
import { filter } from '@progress/kendo-data-query/dist/npm/transducers';


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
  myFilter: IFinanceAPFormFilterState;
  filter?: any;
}

enum ContentTypes {
  Folder = '0x01200088C42F7CFFB6244DA17EE5E6F15B8D22'
}

interface IFinanceAPFormFilterState {
  status: string;   // The Status selected status.
}

export class FinanceApForm extends React.Component<IFinanceApFormProps, IFinanceApFormState> {
  constructor(props) {
    super(props);

    this.state = {
      visibleInvoices: undefined,
      allInvoices: undefined,
      availableInvoices: undefined,
      myFilter: {
        status: 'Approved' // TODO: Get default status from the web part settings. 
      }
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

  /**
   * Parse through the invoice that we will be sending to the user. 
   * This method converts the String date to a correct Date object. 
   * This method queries accounts only for invoice that are being rendered. 
   * @param invoices Invoice after we have filtered the results down.
   * @param allInvoices Optional.  If set this will hold the exising invocies for later. 
   */
  private parseInvoiceFolders = (invoices, allInvoices?) => {
    invoices = invoices.map(v => {
      return {
        ...v,
        Invoice_x0020_Date: new Date(v.Invoice_x0020_Date),
        Received_x0020_Date: new Date(v.Received_x0020_Date),
        Created: new Date(v.Created),
        Modified: new Date(v.Modified)
      };
    });

    // Create a new instance of this object.
    let invoiceHolder = invoices.slice(0);
    this.setState({
      visibleInvoices: invoiceHolder.splice(0, this.TAKE_N),
      availableInvoices: invoiceHolder,
      allInvoices: allInvoices ? allInvoices : invoices
    }, () => this.queryAccountForInvoices(this.state.visibleInvoices));
  }

  private queryInvoices = () => {
    console.log('Query Invoices');
    this.setState({
      visibleInvoices: undefined,
      availableInvoices: undefined,
      allInvoices: undefined
    });
    sp.web.lists.getByTitle('Invoices').items.filter(`OData__Status eq '${this.state.myFilter.status}'`)
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
      .top(2000)
      .getAll().then(value => {
        // We only want folder objects. 
        value = value.filter(f => f.ContentTypeId === ContentTypes.Folder);
        this.parseInvoiceFolders(value);
      }).catch(error => {
        // If you fail at first, try try again.
        sp.web.lists.getByTitle('Invoices').items
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
            value = value.filter(f => f.ContentTypeId === ContentTypes.Folder && f.OData__Status === this.state.myFilter.status);
            this.parseInvoiceFolders(value);
          }).catch(error2 => {
            console.log('\n\nERROR! Cannot Load Invoices!');
            console.log(error);
            console.log(error2);
            console.log('\n\n');
            this.setState({ visibleInvoices: [], allInvoices: [] });
            alert('Something went wrong! Cannot load Invoices.  Please contact helpdesk@clarington.net');
          });
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

      // If the invoice Accounts property is already set we can skip this loop to avoid running extra queries. 
      if (invoice.Accounts && invoice.Accounts.length > 0) {
        continue;
      }

      let accounts = await accountList.items.filter(`InvoiceFolderID eq ${invoice.ID}`).select('ID, Title, AmountIncludingTaxes').get();


      let visibleInvoicesState: IInvoice[] = this.state.visibleInvoices;
      let allInvoicesState: IInvoice[] = this.state.allInvoices;

      // The index of the visibleInvoice array.  These are the invoices that have been rendered. 
      let indexOfVisibleInvoice: number = visibleInvoicesState.findIndex(f => f.ID === invoice.ID);

      // The index of the allInvoices array.  These are the invoices that may or may not have been rendered. 
      // By setting the account in the allInvoices array this prevents us from having to rerun this query again.
      let indexOfAllInvoice: number = allInvoicesState.findIndex(f => f.ID === invoice.ID);

      if (indexOfVisibleInvoice >= 0 && indexOfAllInvoice >= 0) {
        // If no accounts were found this will be an empty array. 
        visibleInvoicesState[indexOfVisibleInvoice].Accounts = [...accounts];
        allInvoicesState[indexOfAllInvoice].Accounts = [...accounts];

        this.setState({
          visibleInvoices: [...visibleInvoicesState],
          allInvoices: [...allInvoicesState]
        });
      }
    }
  }
  //#endregion

  //#region ListView Events
  public scrollHandler = (event: ListViewEvent) => {
    const e = event.nativeEvent;
    /**
     * If we do not check that e.target.classList.contains('k-listview-content')
     * then this scroll event will run for any (Drop Down, Calendar, Combo Box)
     * scroll bar that is nested within the List View.  
     * 
     * See Kendo Support Ticket: https://www.telerik.com/account/support-tickets/view-ticket/1498451
     */
    if (e.target.scrollTop + 10 >= e.target.scrollHeight - e.target.clientHeight && e.target.classList.contains('k-listview-content')) {
      const moreData = this.state.availableInvoices.splice(0, this.TAKE_N);
      if (moreData.length > 0) {
        this.setState({ visibleInvoices: this.state.visibleInvoices.concat(moreData) });
        this.queryAccountForInvoices(moreData);
      }
    }
  }

  public statusDropDownChange = (event: DropDownListChangeEvent) => {
    this.setState({ myFilter: { status: event.value } }, () => this.queryInvoices());
  }

  public searchBoxChange = (event: InputChangeEvent) => {
    let filterInvoices = filterBy(
      this.state.allInvoices,
      {
        logic: 'or',
        filters: [
          // { field: 'Title', operator: 'contains', value: event.value },
          // { field: 'Vendor_x0020_Number', operator: 'contains', value: event.value },
          { field: 'Vendor_x0020_Name', operator: 'contains', value: event.value },
          // { field: 'Invoice_x0020_Number', operator: 'contains', value: event.value },
          // { field: 'PO_x0020__x0023_', operator: 'contains', value: event.value },
          // { field: 'Batch_x0020_Number', operator: 'contains', value: event.value },
        ]
      });

    this.parseInvoiceFolders(filterInvoices, this.state.allInvoices);
  }
  //#endregion

  //#region Render Component Methods
  private MyListViewHeader = () => {
    return (
      <ListViewHeader style={{ padding: '5px' }}>
        <div className='row'>
          <div className='col-sm-3'>
            <DropDownList data={this.state.invoiceStatus} value={this.state.myFilter.status} onChange={this.statusDropDownChange} style={{ width: '100%' }} />
          </div>
          <div className='col-sm-1'>
            1
          </div>
          <div className='col-sm-1'>
            2
          </div>
          <div className='col-sm-7'>
            <Input onChange={this.searchBoxChange} placeholder='Search for Invoices' style={{ width: '100%' }} />
          </div>
        </div>
      </ListViewHeader>
    );
  }

  private MyListViewFooter = () => {
    return (
      <ListViewFooter style={{ color: 'rgb(160, 160, 160)', fontSize: 14, padding: '5px' }}>
        {this.state.visibleInvoices ? `Displaying ${this.state.visibleInvoices.length}/${this.state.allInvoices.length} Invoices.` : 'Loading...'}
      </ListViewFooter>
    );
  }

  private APItemComponentRender = props => <APItemComponent {...props} departments={this.state.departments} invoiceTypes={this.state.invoiceTypes} invoiceStatus={this.state.invoiceStatus} />;
  private APItemLoadingComponentRender = () => <div style={{ paddingLeft: '10px', paddingRight: '10px' }}><MyLoadingComponent /><hr /></div>;
  //#endregion

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      <ListView
        onScroll={this.scrollHandler}
        // [1, 2, 3] is just Shimmer components that we want to load. 
        data={this.state.visibleInvoices ? this.state.visibleInvoices : [1, 2, 3]}
        item={this.state.visibleInvoices ? this.APItemComponentRender : this.APItemLoadingComponentRender}
        style={{ width: "100%", height: 780 }}
        header={this.MyListViewHeader}
        footer={this.MyListViewFooter}
      />
    );
  }
}
