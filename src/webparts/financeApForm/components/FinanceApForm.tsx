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

  loadingMoreAccounts: boolean; // Indicate that we're running a query.

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
  invoiceDateDesc: boolean; // default to newest to oldest. 
}

const INVOICE_SELECT_STRING = `*, 
Department/Title, 
Department/ID,
Received_x0020_Approval_x0020_From/Id, 
Received_x0020_Approval_x0020_From/Title, 
Received_x0020_Approval_x0020_From/EMail,
Requires_x0020_Approval_x0020_From/Id, 
Requires_x0020_Approval_x0020_From/Title, 
Requires_x0020_Approval_x0020_From/EMail
`;

const INVOICE_EXPAND_STRING = 'Department,Received_x0020_Approval_x0020_From,Requires_x0020_Approval_x0020_From';

export class FinanceApForm extends React.Component<IFinanceApFormProps, IFinanceApFormState> {
  constructor(props) {
    super(props);

    this.state = {
      visibleInvoices: undefined,
      allInvoices: undefined,
      availableInvoices: undefined,
      loadingMoreAccounts: true, // Disable right away so users cannot change.
      myFilter: {
        status: this.props.description ? this.props.description : 'Approved',
        showChequeReq: false,
        invoiceDateDesc: true
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
  private formatInvoiceDates = (invoice: IInvoice) => {
    return {
      ...invoice,
      Invoice_x0020_Date: new Date(invoice.Invoice_x0020_Date),
      Received_x0020_Date: new Date(invoice.Received_x0020_Date),
      Created: new Date(invoice.Created),
      Modified: new Date(invoice.Modified)
    };
  }

  /**
   * Parse through the invoice that we will be sending to the user. 
   * This method converts the String date to a correct Date object. 
   * This method queries accounts only for invoice that are being rendered. 
   * @param invoices Invoice after we have filtered the results down.
   * @param allInvoices Optional.  If set this will hold the exising invocies for later. 
   */
  private parseInvoiceFolders = (invoices, allInvoices?) => {
    invoices = invoices.map(v => this.formatInvoiceDates(v));

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
      .select(INVOICE_SELECT_STRING).expand(INVOICE_EXPAND_STRING)
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
    this.setState({ loadingMoreAccounts: true });
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
        allInvoicesState[indexOfAllInvoice].Accounts = accounts;
      }
    } // End of For loop.

    this.setState({
      loadingMoreAccounts: false,
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
    this.setState({ myFilter: { ...this.state.myFilter, status: event.value }, loadingMoreAccounts: true }, () => this.queryInvoices());
  }

  public onChequeReqChange = (event: CheckboxChangeEvent) => {
    this.setState({ myFilter: { ...this.state.myFilter, showChequeReq: event.value } }, () => this.applyNewFilter(this.state.allInvoices));
  }

  public searchBoxChange = (event: InputChangeEvent) => {
    this.applyNewFilter(this.state.allInvoices, { searchBoxValue: event.value });
  }

  public dateOrderChange = () => {
    this.setState({ myFilter: { ...this.state.myFilter, invoiceDateDesc: !this.state.myFilter.invoiceDateDesc } }, () => this.applyNewFilter(this.state.allInvoices));
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
          { field: 'Title', operator: 'contains', value: event.searchBoxValue },
          { field: 'Vendor_x0020_Number', operator: 'contains', value: event.searchBoxValue },
          { field: 'Vendor_x0020_Name', operator: 'contains', value: event.searchBoxValue },
          { field: 'Invoice_x0020_Number', operator: 'contains', value: event.searchBoxValue },
          { field: 'PO_x0020__x0023_', operator: 'contains', value: event.searchBoxValue },
          { field: 'Batch_x0020_Number', operator: 'contains', value: event.searchBoxValue },
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
      //return b.ID - a.ID;
      let aDate: any = new Date(a.Invoice_x0020_Date);
      let bDate: any = new Date(b.Invoice_x0020_Date);
      return this.state.myFilter.invoiceDateDesc ? (bDate - aDate) : (aDate - bDate);
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
            <DropDownList
              data={this.state.invoiceStatus}
              disabled={this.state.loadingMoreAccounts}
              value={this.state.myFilter.status}
              onChange={this.statusDropDownChange}
              style={{ width: '100%' }}
            />
          </div>
          <div className='col-sm-8'>
            <Input onChange={this.searchBoxChange} placeholder='Search by Title, Vendor, Invoice #, PO #, Batch #' style={{ width: '100%' }} />
            <div className='row' style={{ marginTop: '2px' }}>
              <div className='col-sm-6'>
                <Checkbox label={'Show Cheque Reqs'} disabled={this.state.loadingMoreAccounts} value={this.state.myFilter.showChequeReq} onChange={this.onChequeReqChange} />
              </div>
              <div className='col-sm-6'>
                <div onClick={() => { !this.state.loadingMoreAccounts && this.dateOrderChange(); }} style={{ cursor: !this.state.loadingMoreAccounts && 'pointer' }}>
                  <span className={`k-icon ${this.state.myFilter.invoiceDateDesc ? 'k-i-arrow-chevron-down' : 'k-i-arrow-chevron-up'}`}></span><span>Order By Invoice Date.</span>
                </div>
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

  private APItemComponentRender = props => <APItemComponent {...props} onSave={this.onSave} departments={this.state.departments} invoiceTypes={this.state.invoiceTypes} invoiceStatus={this.state.invoiceStatus} />;
  private APItemLoadingComponentRender = () => <div style={{ paddingLeft: '10px', paddingRight: '10px' }}><MyLoadingComponent /><hr /></div>;
  //#endregion

  //#region Invoice Save Methods
  public onSave = async (invoice: IInvoice, event) => {
    try {
      let invoiceSaveObj = this._DeletePropertiesBeforeSave({ ...invoice });

      invoiceSaveObj.DepartmentId = { results: [...invoice.Department.map(d => d.ID)] };
      invoiceSaveObj.HiddenDepartmentId = invoiceSaveObj.DepartmentId;

      let invoiceUpdateResponse = await (await sp.web.lists.getByTitle('Invoices').items.getById(invoice.ID).update({ ...invoiceSaveObj })).item.get();
      let accountUpdateResponse = await this.APInvoiceAccountSave(invoice.ID, invoice.Accounts);

      invoiceUpdateResponse.Accounts = accountUpdateResponse;

      this.InsertNewInvoice({ ...invoiceUpdateResponse, saveSuccess: true });
    } catch (error) {
      this.InsertNewInvoice({ ...invoice, saveSuccess: false });
      throw error;
    }
  }

  /**
     * 
     * @param invoiceID ID of the invoice we want to add these accounts to.
     * @param accounts The current accounts of the invoice. 
     */
  private APInvoiceAccountSave = async (invoiceID: number, accounts: any[]) => {
    let accountList = sp.web.lists.getById('dc5b951f-f68d-42c4-9371-c5515fcf1cab');

    let output = [];
    let response;

    for (let index = 0; index < accounts.length; index++) {
      const account = accounts[index];
      if (account.ID) {
        // Update this account.
        if (this.IsAccountModified(invoiceID, account)) {
          response = await (await accountList.items.getById(account.ID).update(account)).item.get();
        }
        else {
          response = account;
        }
      } else {
        // Create a new account. 
        response = await (await accountList.items.add({ ...account, InvoiceFolderIDId: invoiceID })).item.get();
      }
      output.push(response);
    }

    return output;
  }
  //#endregion

  //#region Invoice Save Helper Methods
  /**
     * Delete properties that we either cannot modify or do not want to modify in SharePoint.
     * @param invoice Invoice to save.
     */
  private _DeletePropertiesBeforeSave = (invoice): IInvoice => {
    delete invoice.Accounts;
    delete invoice.Department;
    delete invoice.ContentTypeId;
    delete invoice.Requires_x0020_Approval_x0020_FromId;
    delete invoice.Received_x0020_Approval_x0020_FromId;
    delete invoice.Requires_x0020_Approval_x0020_From;
    delete invoice.Received_x0020_Approval_x0020_From;
    delete invoice.Requires_x0020_Approval_x0020_FromStringId;
    delete invoice.Received_x0020_Approval_x0020_FromStringId;
    delete invoice.Received_x0020_Deny_x0020_From_x0020_String;
    delete invoice.HiddenApproversId;
    delete invoice.HiddenApproversStringId;
    delete invoice.SharedWithUsersId;
    delete invoice.GUID;
    delete invoice.CheckoutUserId;
    delete invoice.ComplianceAssetId;
    delete invoice.IsApproved;
    delete invoice.MediaServiceKeyPoints;
    delete invoice.MediaServiceAutoTags;
    delete invoice.MediaServiceLocation;
    delete invoice.MediaServiceOCR;
    delete invoice.OData__CopySource;
    delete invoice.ServerRedirectedEmbedUri;
    delete invoice.ServerRedirectedEmbedUrl;
    delete invoice.SharedWithDetails;
    delete invoice.AccountAmount1;
    delete invoice.AuthorId;
    delete invoice.Created;
    delete invoice.DocumentSetDescription;
    delete invoice.EditorId;
    delete invoice.FileSystemObjectType;
    delete invoice.Modified;
    delete invoice.OData__UIVersionString;
    delete invoice.ScannedFileName;
    delete invoice.Title;
    delete invoice.saveSuccess;

    return invoice;
  }

  /**
   * Check to see if the accounts Title or Amount property have been modified compared to the allInvoices state.
   * @param invoiceID ID of the invoice currently being saved.
   * @param account The account we're checking to see if it has been modified. 
   * @returns True if account property has beeen modified.
   */
  private IsAccountModified = (invoiceID: number, account: any): boolean => {
    let allInvoiceIndex = this.state.allInvoices.findIndex(f => f.ID === invoiceID);
    if (allInvoiceIndex < 0) {
      throw `Cannot check account! Invoice ID: ${invoiceID} not found.`;
    }

    let accountIndex = this.state.allInvoices[allInvoiceIndex].Accounts.findIndex(f => f.ID === account.ID);
    if (accountIndex < 0) {
      throw `Cannot check account! Account ID: ${account.ID} not found.`;
    }

    if (this.state.allInvoices[allInvoiceIndex].Accounts[accountIndex].Title !== account.Title) {
      return true;
    }

    if (this.state.allInvoices[allInvoiceIndex].Accounts[accountIndex].AmountIncludingTaxes !== account.AmountIncludingTaxes) {
      return true;
    }

    return false;
  }

  /**
   * Update state variables with the newly modified invoice. 
   * @param invoice Invoice that was just modified
   */
  private InsertNewInvoice = (invoice: IInvoice) => {
    let visibleInvoices = this.state.visibleInvoices;
    let allInvoices = this.state.allInvoices;

    let visibleInvoiceIndex = visibleInvoices.findIndex(f => f.ID === invoice.ID);
    let allInvoiceIndex = allInvoices.findIndex(f => f.ID === invoice.ID);

    if (visibleInvoiceIndex < 0 || allInvoiceIndex < 0) {
      throw 'Could not insert new invoice.';
    }

    visibleInvoices[visibleInvoiceIndex] = { ...visibleInvoices[visibleInvoiceIndex], ...this.formatInvoiceDates(invoice) };
    allInvoices[allInvoiceIndex] = { ...allInvoices[allInvoiceIndex], ...this.formatInvoiceDates(invoice) };

    this.setState({
      visibleInvoices: visibleInvoices,
      allInvoices: allInvoices
    });
  }

  //#endregion

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      <ListView
        onScroll={this.scrollHandler}
        // [1, 2, 3] is just Shimmer components that we want to load. 
        data={this.state.visibleInvoices ? this.state.visibleInvoices : [1, 2, 3]}
        item={this.state.visibleInvoices ? this.APItemComponentRender : this.APItemLoadingComponentRender}
        style={{ width: "100%", height: '100%' }}
        header={this.MyListViewHeader}
        footer={this.MyListViewFooter}
      />
    );
  }
}
