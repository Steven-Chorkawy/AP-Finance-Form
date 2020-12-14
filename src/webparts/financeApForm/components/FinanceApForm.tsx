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
import { Checkbox, CheckboxChangeEvent, Input, InputChangeEvent, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList, DropDownListChangeEvent, MultiSelect } from '@progress/kendo-react-dropdowns';
import { filterBy } from '@progress/kendo-data-query';
import { filter } from '@progress/kendo-data-query/dist/npm/transducers';


// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';
import { IInvoice } from '../interfaces/IInvoice';
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
  myFilter: IFinanceAPFormFilterState;
  filter?: any;
}

enum ContentTypes {
  Folder = '0x01200088C42F7CFFB6244DA17EE5E6F15B8D22'
}

interface IFinanceAPFormFilterState {
  status: string;           // The Status selected status.
  showChequeReq: boolean;   // If we want to show cheque reqs or not. 
  searchBoxFilterObject?: any;
}

export class FinanceApForm extends React.Component<IFinanceApFormProps, IFinanceApFormState> {
  constructor(props) {
    super(props);

    this.state = {
      visibleInvoices: undefined,
      allInvoices: undefined,
      availableInvoices: undefined,
      myFilter: {
        status: 'Approved',   // TODO: Get default status from the web part settings. 
        showChequeReq: false
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
    let visibleInvoices = invoiceHolder.splice(0, this.TAKE_N);
    // We are not setting the visibleInvoices state here.  Instead we will do it in the queryaccountForInvoices method. 
    this.setState({
      availableInvoices: invoiceHolder,
      allInvoices: allInvoices ? allInvoices : invoices
    }, () => this.queryAccountForInvoices(visibleInvoices));
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
      Department/ID,
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
        this.applyNewFilter(value);
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
            this.applyNewFilter(value);
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
   * Gets the accounts for each invoice & sets the visible invoice state property. 
   * This method must be called when loading new invoices. 
   * @param visibleInvoices The invoices that have been rendered. 
   */
  private queryAccountForInvoices = async (visibleInvoices: IInvoice[]) => {
    let accountList = sp.web.lists.getById('dc5b951f-f68d-42c4-9371-c5515fcf1cab');
 
    let allInvoicesState: IInvoice[] = this.state.allInvoices;

    for (let index = 0; index < visibleInvoices.length; index++) {
      //const invoice = visibleInvoices[index];

      // If the invoice Accounts property is already set we can skip this loop to avoid running extra queries. 
      if (visibleInvoices[index].Accounts && visibleInvoices[index].Accounts.length > 0) {
        continue;
      }

      // If there are not accounts present this will return an empty array.
      let accounts = await accountList.items.filter(`InvoiceFolderID eq ${visibleInvoices[index].ID}`).select('ID, Title, AmountIncludingTaxes').get();

      // This will allow the accounts to be rendered. 
      visibleInvoices[index].Accounts = [...accounts];

      // The index of the allInvoices array.  These are the invoices that may or may not have been rendered. 
      // By setting the account in the allInvoices array this prevents us from having to rerun this query again.
      let indexOfAllInvoice: number = allInvoicesState.findIndex(f => f.ID === visibleInvoices[index].ID);
      if (indexOfAllInvoice >= 0) {
        // This will hold the same account for later if needed. 
        allInvoicesState[indexOfAllInvoice].Accounts = [...accounts];
      }
    } // End of For loop.

    this.setState({
      visibleInvoices: [...visibleInvoices],
      allInvoices: [...allInvoicesState]
    });
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
        this.queryAccountForInvoices(this.state.visibleInvoices.concat(moreData));
      }
    }
  }
  //#endregion

  //#region Filter Methods
  public statusDropDownChange = (event: DropDownListChangeEvent) => {
    this.setState({ myFilter: { ...this.state.myFilter, status: event.value } }, () => this.queryInvoices());
  }

  public onChequeReqChange = (event: CheckboxChangeEvent) => {
    this.setState({ myFilter: { ...this.state.myFilter, showChequeReq: event.value } }, () => this.applyNewFilter(this.state.allInvoices));
  }

  public searchBoxChange = (event: InputChangeEvent) => {
    this.applyNewFilter(this.state.allInvoices, { searchBoxValue: event.value });
  }

  private applyNewFilter = (allInvoices: any[], event?: any) => {
    // Always apply this filter.
    const defaultFilter: any = {
      logic: "and",
      filters: [
        { field: 'IsChequeReq', operator: 'eq', value: this.state.myFilter.showChequeReq },
      ]
    };

    let finalFilterObj: any = defaultFilter;

    if (event && event.searchBoxValue !== "") {
      let searchBoxFilterObj = {
        logic: "or",
        filters: [
          // { field: 'Title', operator: 'contains', value: event.value },
          { field: 'Vendor_x0020_Number', operator: 'contains', value: event.searchBoxValue },
          { field: 'Vendor_x0020_Name', operator: 'contains', value: event.searchBoxValue },
          { field: 'Invoice_x0020_Number', operator: 'contains', value: event.searchBoxValue },
          // { field: 'PO_x0020__x0023_', operator: 'contains', value: event.value },
          // { field: 'Batch_x0020_Number', operator: 'contains', value: event.value },
        ]
      };

      this.setState({ myFilter: { ...this.state.myFilter, searchBoxFilterObject: searchBoxFilterObj } });
      finalFilterObj.filters.push(searchBoxFilterObj);
    }
    else if (event && event.searchBoxValue === "") {
      this.setState({ myFilter: { ...this.state.myFilter, searchBoxFilterObject: undefined } });
    }
    else if (!event && this.state.myFilter.searchBoxFilterObject) {
      finalFilterObj.filters.push(this.state.myFilter.searchBoxFilterObject);
    }

    let filterInvoices = filterBy(allInvoices, finalFilterObj);

    // I always want to show these. 
    filterInvoices.push(...allInvoices.filter(f => { return f.IsChequeReq === null; }));

    filterInvoices = filterInvoices.sort((a, b) => {
      return b.ID - a.ID;
    });

    this.parseInvoiceFolders(filterInvoices, allInvoices);
  }
  //#endregion

  //#region Render Component Methods
  private MyListViewHeader = () => {
    return (
      <ListViewHeader style={{ padding: '5px' }}>
        <div className='row'>
          <div className='col-sm-4'>
            <DropDownList data={this.state.invoiceStatus} value={this.state.myFilter.status} onChange={this.statusDropDownChange} style={{ width: '100%' }} />
          </div>
          <div className='col-sm-8'>
            <Input onChange={this.searchBoxChange} placeholder='Search for Invoices' style={{ width: '100%' }} />
            <div className='row'>
              <div className='col-sm-6'>
                <Checkbox label={'Show Cheque Reqs'} value={this.state.myFilter.showChequeReq} onChange={this.onChequeReqChange} />
              </div>
              <div className='col-sm-6'>
                sort by date.
              </div>
            </div>
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
