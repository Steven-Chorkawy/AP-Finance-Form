import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/profiles";
import "@pnp/sp/items/get-all";

import { IAPInvoiceQueryItem } from '../financeApForm/interfaces/IInvoice';
import { MyLists } from "./enums/MyLists";


export const APPROVER_LIST_MODIFIED_WORKFLOW = "https://prod-21.canadacentral.logic.azure.com:443/workflows/b6a3c8936a104ba6af0e21861cbd24b2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2lr1ovb9d-6vLLLefO7fqubhmho_zl3fSitzmWwZWH8";

let _sp: SPFI;

export const getSP = (context?: WebPartContext): SPFI => {
  if (context) {
    _sp = spfi().using(SPFx(context as ISPFXContext));
  }
  return _sp;
};

export const FormatCurrency = (n: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

export const SumAccounts = (accounts): string => {
  if (!accounts) {
    return FormatCurrency(0);
  }
  return FormatCurrency(accounts.reduce((a, b) => a + (b['AmountIncludingTaxes'] || 0), 0));
};

export const GetUserByLoginName = async (loginName: string): Promise<any> => {
  return await getSP().web.siteUsers.getByLoginName(loginName)();
};

export const GetUsersByLoginName = async (users: Array<any>): Promise<Array<any>> => {
  let returnOutput: Array<any> = [];
  for (let index = 0; index < users.length; index++) {
    const user = users[index];
    returnOutput.push(await GetUserByLoginName(user.loginName));
  }
  return returnOutput;
};

/**
 * 
 * @param account An account code list item with the 'Author' field populated.
 */
export const GetUserByID = async (userId: any): Promise<void | ISiteUserInfo> => {
  // Catch any errors that occur and log them to the console.  This query is not a critical step and shouldn't prevent the forms from loading.
  let author = await getSP().web.getUserById(userId)().catch(reason => {
    console.log(`CANNOT LOAD AUTHOR! ${userId}`);
    console.log(reason);
  });
  return author;
};

export const GetAllInvoices = async (): Promise<IAPInvoiceQueryItem[]> => {
  let output = [];
  try {
    output = await getSP().web.lists.getByTitle(MyLists.Invoices).items.getAll();
  } catch (error) {
    console.log('Failed to get invoices using the getAll() method.');
    console.error(error);
  }

  return output;
}

export const GetInvoiceByStatus = async (status: string): Promise<IAPInvoiceQueryItem[]> => {
  let output = [];

  try {
    output = await getSP().web.lists.getByTitle(MyLists.Invoices).getItemsByCAMLQuery({ ViewXml: `<View><Query><Where><Eq><FieldRef Name="_Status"/><Value Type="Choice">${status}</Value></Eq></Where></Query></View>` }, 'FieldValuesAsText');
  } catch (error) {
    console.error(error);
    console.log('Attempting to use getAll() method.');
    let allInvoices = await GetAllInvoices();
    output = allInvoices.filter(f => f.OData__Status === status);
  }

  for (let index = 0; index < output.length; index++) {
    const invoice = output[index];
    if (invoice.FieldValuesAsText) {
      if (invoice.FieldValuesAsText.Requires_x005f_x0020_x005f_Approval_x005f_x0020_x005f_From) {
        output[index].Requires_x0020_Approval_x0020_From = invoice.FieldValuesAsText.Requires_x005f_x0020_x005f_Approval_x005f_x0020_x005f_From;
      }

      if (invoice.FieldValuesAsText.Received_x005f_x0020_x005f_Approval_x005f_x0020_x005f_From) {
        output[index].Received_x0020_Approval_x0020_From = invoice.FieldValuesAsText.Received_x005f_x0020_x005f_Approval_x005f_x0020_x005f_From;
      }

      delete output[index].FieldValuesAsText;
    }
  }

  return output;
}

export const GetInvoiceStatusColumn = async (): Promise<string[]> => {
  let output = await getSP().web.lists.getByTitle(MyLists.Invoices).fields.getByTitle('Status').select('Choices')();
  return output.Choices;
}

export const QueryAccountForInvoice = async (invoiceId: number): Promise<any> => {
  const INVOICE_ACCOUNT_SELECT_STRING = 'ID, Title, AmountIncludingTaxes, PO_x0020_Line_x0020_Item_x0020__, AuthorId';

  const ACCOUNT_LIST = getSP().web.lists.getById(MyLists.InvoiceAccountCode_ID);

  let accounts = await ACCOUNT_LIST.items.filter(`InvoiceFolderID eq ${invoiceId}`).select(INVOICE_ACCOUNT_SELECT_STRING)();
  // Using the AuthorId field query the full author information. 
  for (let accountIterator = 0; accountIterator < accounts.length; accountIterator++) {
    accounts[accountIterator]['Author'] = await GetUserByID(accounts[accountIterator].AuthorId);
  }

  return accounts;
}