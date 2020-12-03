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
import { Button } from '@progress/kendo-react-buttons';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Label, Error } from '@progress/kendo-react-labels';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';


// My Imports 
import { MyLoadingComponent } from './MyLoadingComponent';
import { IInvoice } from '../interfaces/IInvoice';
import { values } from 'office-ui-fabric-react/lib/Utilities';

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

const AccountFieldComponent = (fieldArrayRenderProps) => {
  return (
    <Grid
      data={fieldArrayRenderProps.value}
    >
      <GridToolbar>
        <Button title="Add new" primary={true} look='flat' onClick={e => console.log(e)} >Add Account</Button>
      </GridToolbar>
      <GridColumn field="Title" title="Title" />
      <GridColumn field="AmountIncludingTaxes" title="AmountIncludingTaxes" />
      {/* <GridColumn field="name" title="Name" cell={nameCell} /> */}
      {/* <GridColumn cell={commandCell(onRemove)} width="240px" /> */}
    </Grid>
  );
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
      .getAll()
      .then(value => {

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

    debugger;

    for (let index = 0; index < visibleInvoices.length; index++) {
      debugger;
      const invoice = visibleInvoices[index];

      let accounts = await accountList.items.filter(`InvoiceFolderID eq ${invoice.ID}`).select('ID, Title, AmountIncludingTaxes').get();

      let visibleInvoicesState: IInvoice[] = this.state.visibleInvoices;

      let indexOfVisibleInvoice: number = visibleInvoicesState.findIndex(f => f.ID === invoice.ID);

      if (indexOfVisibleInvoice >= 0) {
        visibleInvoicesState[indexOfVisibleInvoice].Accounts = [...accounts];
        debugger;
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

  /**
   * Render an item/row in the list view.
   * @param props List view props.
   */
  private MyListViewItemRender = props => {
    let item: IInvoice = props.dataItem;
    return (
      <Form
        onSubmit={e => console.log(e)}

        initialValues={item}

        render={(formRenderProps) => (
          <FormElement style={{ marginTop: '0px' }}>
            <Card style={{ marginBottom: '10px', marginLeft: '2px', marginRight: '2px', fontSize: '1.5rem', paddingTop: '0px' }}>
              <CardHeader>
                <div className='row'>
                  <div className='col-xs-10 col-sm-10 col-md-10' style={{ paddingLeft: '0px' }}>
                    <CardTitle><span title='Vendor Name'>{formRenderProps.valueGetter('Vendor_x0020_Name')}</span> | <span title='Vendor ID'>{formRenderProps.valueGetter('Vendor_x0020_Number')}</span></CardTitle>
                  </div>
                  <div className='col-xs-2 col-sm-2 col-md-2'>
                    <Button
                      style={{ float: 'right' }}
                      primary={true}
                      look='flat'
                      icon='edit'
                      title='Edit Invoice'
                      onClick={e => console.log(e)}
                    />
                    {
                      formRenderProps.modified &&
                      <Button
                        style={{ float: 'right' }}
                        look='flat'
                        icon='cancel'
                        title='Cancel Changes'
                        onClick={formRenderProps.onFormReset}
                      />
                    }
                  </div>
                </div>
                <CardSubtitle style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                  <span title='Invoice Number'>{formRenderProps.valueGetter('Invoice_x0020_Number')}</span> | <span title='Invoice Title'>{formRenderProps.valueGetter('Title')}</span> | <span title='Invoice Type'>{formRenderProps.valueGetter('Invoice_x0020_Type')}</span>
                </CardSubtitle>
              </CardHeader>
              <CardBody>
                <div className='row'>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'OData__Status'}>Invoice Status:</Label>
                      <Field name='OData__Status' component={DropDownList} data={this.state.invoiceStatus ? this.state.invoiceStatus : []} />
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Invoice_x0020_Type'}>Invoice Type:</Label>
                      <Field name='Invoice_x0020_Type' component={DropDownList} data={this.state.invoiceTypes ? this.state.invoiceTypes : []} />
                    </FieldWrapper>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-xs-12 col-sm-4'>
                    <FieldWrapper>
                      <Label editorId={'Department'}>Departments:</Label>
                      <Field name='Department' component={MultiSelect} textField='Title' dataItemKey='ID' data={this.state.departments ? [...this.state.departments] : []} />
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-4'>
                    <FieldWrapper>
                      <Label>Requires Approval From:</Label>
                      {item.Requires_x0020_Approval_x0020_From.sort((a, b) => a.Title < b.Title ? -1 : a.Title > b.Title ? 1 : 0).map(user => {
                        return <div>{user.Title}</div>;
                      })}
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-4'>
                    <FieldWrapper>
                      <Label>Received Approval From:</Label>
                      {item.Received_x0020_Approval_x0020_From.sort((a, b) => a.Title < b.Title ? -1 : a.Title > b.Title ? 1 : 0).map(user => {
                        return <div>{user.Title}</div>;
                      })}
                    </FieldWrapper>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Invoice_x0020_Number'}>Invoice Number:</Label>
                      <Field name='Invoice_x0020_Number' component={Input} />
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'PO_x0020__x0023_'}>PO #:</Label>
                      <Field name='PO_x0020__x0023_' component={Input} />
                    </FieldWrapper>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Invoice_x0020_Date'}>Invoice Date:</Label>
                      <Field name='Invoice_x0020_Date' component={DatePicker} />
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Received_x0020_Date'}>Received Date:</Label>
                      <Field name='Received_x0020_Date' component={DatePicker} />
                    </FieldWrapper>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Gross_x0020_Amount'}>Gross Amount:</Label>
                      <Field name='Gross_x0020_Amount' component={NumericTextBox} format="c2" min={0} />
                    </FieldWrapper>
                  </div>
                  <div className='col-xs-12 col-sm-6'>
                    <FieldWrapper>
                      <Label editorId={'Total_x0020_Tax_x0020_Amount'}>Total Tax Amount:</Label>
                      <Field name='Total_x0020_Tax_x0020_Amount' component={NumericTextBox} format="c2" min={0} />
                    </FieldWrapper>
                  </div>
                </div>
                {
                  item.Accounts &&
                  <div className='row'>
                    <div className='col-sm-12'>
                      <FieldWrapper>
                        <FieldArray
                          name="Accounts"
                          component={AccountFieldComponent}
                          value={item.Accounts}
                        />
                      </FieldWrapper>
                    </div>
                  </div>
                }
              </CardBody>
            </Card>
          </ FormElement>
        )}
      />
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

  private TAKE_N = 25;

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      this.state.visibleInvoices ? this.RenderListView() : <MyLoadingComponent />
    );
  }
}
