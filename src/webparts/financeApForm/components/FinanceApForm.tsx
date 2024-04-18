import * as React from 'react';

// PnP imports. 
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import "@pnp/sp/profiles";
import "@pnp/sp/items/get-all";

// Kendo Imports 
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Checkbox, CheckboxChangeEvent, Input, InputChangeEvent } from '@progress/kendo-react-inputs';
import { DropDownList, DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { filterBy } from '@progress/kendo-data-query';
import { chevronDownIcon, chevronUpIcon, minusIcon, plusIcon } from '@progress/kendo-svg-icons';

// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';
import { IInvoice } from '../interfaces/IInvoice';
import { APItemComponent } from './APItemComponent';
import * as MyHelper from '../MyHelperMethods';
import { PageChangeEvent, Pager } from '@progress/kendo-react-data-tools';
import { Button } from '@progress/kendo-react-buttons';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import PackageSolutionVersion from './PackageSolutionVersion';
import { APPROVER_LIST_MODIFIED_WORKFLOW, getSP } from '../MyHelperMethods';
import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';



/**
 * Props interface for FinanceApForm component class.
 */
export interface IFinanceApFormProps {
  description: string;
  defaultInvoiceLink: string;
  context: WebPartContext;
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
  pager: {
    skip: number;
    take: number;
  };

  showAllInvoicesDetails: boolean; // Determines if all invoices details should be visible. 
}

enum ContentTypes {
  Folder = '0x01200088C42F7CFFB6244DA17EE5E6F15B8D22'
}

interface IFinanceAPFormFilterState {
  status: string;           // The Status selected status.
  showChequeReq: boolean;   // If we want to show cheque reqs or not. 
  searchBoxFilterObject?: any;
  searchBoxLength?: number;
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

const INVOICE_ACCOUNT_SELECT_STRING = 'ID, Title, AmountIncludingTaxes, PO_x0020_Line_x0020_Item_x0020__, AuthorId';

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
      },
      pager: {
        skip: 0,
        take: this.TAKE_N
      },
      showAllInvoicesDetails: false
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
      Invoice_x0020_Date: invoice.Invoice_x0020_Date ? new Date(invoice.Invoice_x0020_Date) : undefined,
      Received_x0020_Date: invoice.Received_x0020_Date ? new Date(invoice.Received_x0020_Date) : undefined,
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
   * @param searchBoxLength The number of characters in the search box.  This is used to determine if we should really be running the query account for invoice method. 
   */
  private parseInvoiceFolders = (invoices, allInvoices?, searchBoxLength?: Number) => {
    invoices = invoices.map(v => this.formatInvoiceDates(v));

    // Create a new instance of this object.
    let invoiceHolder = invoices.slice(0);
    // These are the invoices that will be displayed to the user.
    let visibleInvoices = invoiceHolder.slice(this.state.pager.skip, this.state.pager.skip + this.state.pager.take);

    // We are not setting the visibleInvoices state here.  Instead we will do it in the query AccountForInvoices method. 
    this.setState({
      availableInvoices: invoiceHolder,
      allInvoices: allInvoices ? allInvoices : invoices
    }, () => this.queryAccountForInvoices(visibleInvoices, searchBoxLength));
  }

  private queryInvoiceById = async (id: number) => {
    let invoice = await getSP().web.lists.getByTitle('Invoices').items.getById(id).select(INVOICE_SELECT_STRING).expand(INVOICE_EXPAND_STRING)();

    let accounts = await getSP().web.lists.getByTitle('Invoice Accounts').items.filter(`InvoiceFolderID eq ${id}`).select('ID, Title, AmountIncludingTaxes, PO_x0020_Line_x0020_Item_x0020__, AuthorId')();
    for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
      accounts[accountIndex]['Author'] = await MyHelper.GetUserByID(accounts[accountIndex].AuthorId);
    }
    invoice.Accounts = accounts;

    return invoice;
  }

  private queryInvoices = () => {
    this.setState({
      visibleInvoices: undefined,
      availableInvoices: undefined,
      allInvoices: undefined
    });
    getSP().web.lists.getByTitle('Invoices').items.filter(`OData__Status eq '${this.state.myFilter.status}'`)
      .select(INVOICE_SELECT_STRING)
      .expand(INVOICE_EXPAND_STRING)
      .top(2000)
      .getAll()
      .then(value => {
        // We only want folder objects. 
        value = value.filter(f => f.ContentTypeId === ContentTypes.Folder);
        this.applyNewFilter(value);
      }).catch(error => {
        // If you fail at first, try try again.
        getSP().web.lists.getByTitle('Invoices').items
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
    getSP().web.lists.getByTitle('Departments').items.select('Title, ID').getAll().then(value => {
      this.setState({
        departments: value
      });
    });
  }

  private queryInvoiceTypes = async () => {
    getSP().web.lists.getByTitle('Invoices').fields.getByTitle('Invoice Type').select('Choices')().then((value: any) => {
      this.setState({
        invoiceTypes: value.Choices
      });
    });
  }

  private queryInvoiceStatus = async () => {
    getSP().web.lists.getByTitle('Invoices').fields.getByTitle('Status').select('Choices')().then((value: any) => {
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
  private queryAccountForInvoices = async (visibleInvoices: IInvoice[], searchBoxLength?: Number) => {
    this.setState({ loadingMoreAccounts: true });
    let accountList = getSP().web.lists.getById('dc5b951f-f68d-42c4-9371-c5515fcf1cab');

    let allInvoicesState: IInvoice[] = this.state.allInvoices;

    for (let index = 0; index < visibleInvoices.length; index++) {
      //const invoice = visibleInvoices[index];

      // If the invoice Accounts property is already set we can skip this loop to avoid running extra queries. 
      if (visibleInvoices[index].Accounts && visibleInvoices[index].Accounts.length > 0) {
        continue;
      }

      if (this.state.myFilter.searchBoxLength && (this.state.myFilter.searchBoxLength !== searchBoxLength)) {
        break;
      }

      // If there are not accounts present this will return an empty array.
      // Since selecting the Author field is not support I have select the AuthorId field instead.
      let accounts = await accountList.items.filter(`InvoiceFolderID eq ${visibleInvoices[index].ID}`).select(INVOICE_ACCOUNT_SELECT_STRING)();

      // Using the AuthorId field query the full author information. 
      for (let accountIterator = 0; accountIterator < accounts.length; accountIterator++) {
        accounts[accountIterator]['Author'] = await MyHelper.GetUserByID(accounts[accountIterator].AuthorId);
      }

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
  /**
   * 
   * @param e PageChangeEvent
   */
  public handlePageChange = (e: PageChangeEvent) => {
    // * This is now we can use the pager to display invoices.
    // * this.state.allInvoices.slice(e.skip, e.skip + e.take)
    this.setState({
      visibleInvoices: undefined,
      pager: {
        skip: e.skip,
        take: e.take
      }
    }, () => this.applyNewFilter(this.state.allInvoices));
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
    this.setState({
      visibleInvoices: undefined,
      myFilter: { ...this.state.myFilter, searchBoxLength: event.value ? event.value.length : 0 }
    },
      () => this.applyNewFilter(this.state.allInvoices, { searchBoxValue: event.value })
    );
  }

  public dateOrderChange = () => {
    this.setState({ myFilter: { ...this.state.myFilter, invoiceDateDesc: !this.state.myFilter.invoiceDateDesc } }, () => this.applyNewFilter(this.state.allInvoices));
  }

  private applyNewFilter = (allInvoices: any[], event?: any) => {
    // Always apply this filter.
    let chequeReqFilter: any = {};

    if (this.state.myFilter.showChequeReq === true) {
      // When true we only want to see cheque reqs.
      chequeReqFilter = {
        logic: "and",
        filters: [
          { field: 'IsChequeReq', operator: 'eq', value: this.state.myFilter.showChequeReq },
        ]
      };
    }
    else {
      // When false we want to see null and false values.  Anything but True values.
      chequeReqFilter = {
        logic: "and",
        filters: [
          { field: 'IsChequeReq', operator: 'neq', value: true },
        ]
      };
    }

    let finalFilterObj: any = chequeReqFilter;

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

    /**
     * 02/10/2023 - https://clarington.freshservice.com/a/tickets/27716 - I don't believe this is required anymore now that the chequeReqFilter is using a 'neq' filter.
     *
     * */
    // // I always want to show these. 
    // filterInvoices.push(...allInvoices.filter(f => { return f.IsChequeReq === null; }));

    filterInvoices = filterInvoices.sort((a, b) => {
      //return b.ID - a.ID;
      let aDate: any = new Date(a.Invoice_x0020_Date);
      let bDate: any = new Date(b.Invoice_x0020_Date);
      return this.state.myFilter.invoiceDateDesc ? (bDate - aDate) : (aDate - bDate);
    });

    let searchBoxLength = (event && event.searchBoxValue) ?
      event.searchBoxValue.length :
      this.state.myFilter.searchBoxLength ?
        this.state.myFilter.searchBoxLength :
        0;

    this.parseInvoiceFolders(filterInvoices, allInvoices, searchBoxLength);
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
              <div className='col-sm-4'>
                <Checkbox label={'Show Cheque Reqs'} disabled={this.state.loadingMoreAccounts} value={this.state.myFilter.showChequeReq} onChange={this.onChequeReqChange} />
              </div>
              <div className='col-sm-4'>
                <Button
                  fillMode='flat'
                  svgIcon={this.state.myFilter.invoiceDateDesc ? chevronDownIcon : chevronUpIcon}
                  onClick={e => {
                    e.preventDefault();
                    this.dateOrderChange();
                  }}
                  disabled={this.state.loadingMoreAccounts}
                >Order By Invoice Date</Button>
              </div>
              <div className='col-sm-4'>
                <Button
                  style={{ float: 'right' }}
                  fillMode='flat'
                  svgIcon={this.state.showAllInvoicesDetails ? minusIcon : plusIcon}
                  title={this.state.showAllInvoicesDetails ? 'Hide All Invoice Details' : 'Expand All Invoice Details'}
                  onClick={e => {
                    e.preventDefault();
                    this.setState({ showAllInvoicesDetails: !this.state.showAllInvoicesDetails });
                  }}
                  disabled={this.state.loadingMoreAccounts}
                >{this.state.showAllInvoicesDetails ? 'Hide All Invoice Details' : 'Expand All Invoice Details'}</Button>
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
        {
          this.state.allInvoices &&
          <Pager
            skip={this.state.pager.skip}
            take={this.state.pager.take}
            onPageChange={this.handlePageChange}
            total={(this.state.myFilter.searchBoxFilterObject && this.state.visibleInvoices) ? this.state.visibleInvoices.length : this.state.allInvoices.length}
          />
        }
      </ListViewFooter>
    );
  }

  private APItemComponentRender = props => <APItemComponent
    {...props}
    onSave={this.onSave}
    defaultInvoiceLink={this.props.defaultInvoiceLink}
    departments={this.state.departments}
    invoiceTypes={this.state.invoiceTypes}
    invoiceStatus={this.state.invoiceStatus}
    context={this.props.context}
    showMore={this.state.showAllInvoicesDetails}
  />

  private APItemLoadingComponentRender = () => <div style={{ paddingLeft: '10px', paddingRight: '10px' }}><MyLoadingComponent /><hr /></div>;
  //#endregion

  //#region Invoice Save Methods
  private _triggerApprovalWorkflow = async (invoiceID: number): Promise<void> => {
    const body: string = JSON.stringify({ 'InvoiceID': invoiceID });
    const requestHeaders: Headers = new Headers();
    requestHeaders.append('Content-type', 'application/json');
    const httpClientOptions: IHttpClientOptions = {
      body: body,
      headers: requestHeaders
    };
    this.props.context.httpClient.post(
      APPROVER_LIST_MODIFIED_WORKFLOW,
      HttpClient.configurations.v1,
      httpClientOptions
    )
      .then((response: HttpClientResponse) => {
        console.log("Workflow Triggered!");
      }).catch(reason => {
        console.error('Failed to trigger approval workflow!');
        console.error(reason);
        alert('Failed to trigger approval workflow.  Please try again or notify helpdesk@clarington.net');
      });
  }

  /**
   * https://stackoverflow.com/a/53606357
   */
  private _ApprovalWorkflowRunChecker = (arr, target) => {
    return target.every(v => arr?.includes(v));
  }

  public onSave = async (invoice: IInvoice, event) => {
    try {
      const newApprovers = invoice.Requires_x0020_Approval_x0020_FromId;
      const oldApprovers = invoice.Requires_x0020_Approval_x0020_FromStringId?.map(f => { return Number(f); });
      debugger;
      // If this is false I want to trigger the approval workflow AFTER the invoice metadata has been saved.
      // Adding a ! before this method so that it will be TRUE when we want to trigger the invoice workflow.
      let triggerApprovalWorkflow = !this._ApprovalWorkflowRunChecker(oldApprovers, newApprovers);

      // Remove any extra fields that have been added to this object by SharePoint.
      let invoiceSaveObj = this._DeletePropertiesBeforeSave({ ...invoice });
      // Lookup columns need to be formatted 
      invoiceSaveObj.DepartmentId = [...invoice.Department.map(d => d.ID)];

      // Save the AP Invoice.
      // await (await getSP().web.lists.getByTitle('Invoices').items.getById(invoice.ID).update({ ...invoiceSaveObj })).item.get();
      await getSP().web.lists.getByTitle('Invoices').items.getById(invoice.ID).update({ ...invoiceSaveObj });

      if (triggerApprovalWorkflow) {
        this._triggerApprovalWorkflow(invoiceSaveObj.ID);
      }

      // Save/Update any changes made to the accounts.
      await this.APInvoiceAccountSave(invoice.ID, invoice.Accounts);

      // 'queryInvoiceById' will bring the updated invoice and updated account details back together into one object.
      this.InsertNewInvoice({ ...await this.queryInvoiceById(invoice.ID), saveSuccess: true });
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
    let accountList = getSP().web.lists.getById('dc5b951f-f68d-42c4-9371-c5515fcf1cab');

    let output = [];
    let response;

    for (let index = 0; index < accounts.length; index++) {
      const account = accounts[index];
      if (account.ID) {
        // Update this account.
        if (this.IsAccountModified(invoiceID, account)) {
          // Steven C. 08/19/2022. I am commenting these lines out because the author field will be populated later by the 'queryInvoiceById' method.
          //let accountAuthor = account.Author;
          response = await (await accountList.items.getById(account.ID).update(this._DeleteAccountPropertiesBeforeSave(account))).item; // TODO: Will this work?
          // response['Author'] = accountAuthor;
        }
        else {
          response = account;
        }
      } else {
        // Create a new account. 
        // No need to remove extra fields here because they won't exist yet.
        response = await (await accountList.items.add({ ...account, InvoiceFolderIDId: invoiceID })).item; // TODO: Will this work? 
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
    //delete invoice.Received_x0020_Approval_x0020_FromId;
    delete invoice.Requires_x0020_Approval_x0020_From;
    delete invoice.Received_x0020_Approval_x0020_From;
    delete invoice.Requires_x0020_Approval_x0020_FromStringId;
    delete invoice.Received_x0020_Approval_x0020_FromStringId;
    delete invoice.Received_x0020_Deny_x0020_From_x0020_String;
    delete invoice.HiddenApproversId;
    delete invoice.HiddenApproversStringId;
    delete invoice.HiddenDepartmentId;
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
    //delete invoice.DocumentSetDescription;
    delete invoice.EditorId;
    delete invoice.FileSystemObjectType;
    delete invoice.Modified;
    delete invoice.OData__UIVersionString;
    delete invoice.ScannedFileName;
    delete invoice.Title;
    delete invoice.saveSuccess;
    delete invoice.OData__ip_UnifiedCompliancePolicyProperties;
    delete invoice.MediaServiceImageTags;
    delete invoice['odata.type'];
    delete invoice['odata.metadata'];
    delete invoice['odata.id'];
    delete invoice['odata.etag'];
    delete invoice['odata.editLink'];
    delete invoice['Requires_x0020_Approval_x0020_From@odata.navigationLinkUrl'];
    delete invoice['Received_x0020_Approval_x0020_From@odata.navigationLinkUrl'];
    delete invoice['Department@odata.navigationLinkUrl'];

    // Only delete Requires_x0020_Approval_x0020_FromId if the results property is missing. 
    if (invoice.Requires_x0020_Approval_x0020_FromId === null) {
      delete invoice.Requires_x0020_Approval_x0020_FromId;
    }
    if (invoice.Received_x0020_Approval_x0020_FromId === null) {
      delete invoice.Received_x0020_Approval_x0020_FromId;
    }

    return invoice;
  }

  /**
   * Remove ID, Id, Author, AuthorId from the account item to allow it to be saved.
   * @param account GL/Account Item that is to be saved/ updated.
   */
  private _DeleteAccountPropertiesBeforeSave = (account: any) => {
    delete account.ID;
    delete account.Id;
    delete account.Author;
    delete account.AuthorId;
    return account;
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

    if (this.state.allInvoices[allInvoiceIndex].Accounts[accountIndex].PO_x0020_Line_x0020_Item_x0020__ !== account.PO_x0020_Line_x0020_Item_x0020__) {
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

    /* Steven Chorkawy 06/08/2021
     * This appears to be what is causing the Req and Rec Approval fields to not update after a save. 
     */
    // visibleInvoices[visibleInvoiceIndex] = { ...visibleInvoices[visibleInvoiceIndex], ...this.formatInvoiceDates(invoice) };
    visibleInvoices[visibleInvoiceIndex] = { ...invoice, ...this.formatInvoiceDates(invoice) };

    allInvoices[allInvoiceIndex] = { ...allInvoices[allInvoiceIndex], ...this.formatInvoiceDates(invoice) };

    this.setState({
      visibleInvoices: visibleInvoices,
      allInvoices: allInvoices
    });
  }
  //#endregion

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      <div>
        <ListView
          //onScroll={this.scrollHandler}
          // [1, 2, 3] is just Shimmer components that we want to load.
          data={this.state.visibleInvoices ? this.state.visibleInvoices : [1, 2, 3]}
          item={this.state.visibleInvoices ? this.APItemComponentRender : this.APItemLoadingComponentRender}
          style={{ width: "100%", maxWidth: '1000px', height: '100%', maxHeight: '800px', marginRight: 'auto', marginLeft: 'auto' }}
          header={this.MyListViewHeader}
          footer={this.MyListViewFooter}
        />
        <PackageSolutionVersion />
      </div>
    );
  }
}
