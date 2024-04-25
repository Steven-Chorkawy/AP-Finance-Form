import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ISPFXContext, SPFI, SPFx, spfi } from "@pnp/sp";
import { ISiteUserInfo } from "@pnp/sp/site-users/types";

export const APPROVER_LIST_MODIFIED_WORKFLOW = "https://prod-21.canadacentral.logic.azure.com:443/workflows/b6a3c8936a104ba6af0e21861cbd24b2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2lr1ovb9d-6vLLLefO7fqubhmho_zl3fSitzmWwZWH8";

export enum MyLists {
  Invoices = "Invoices"
}

let _sp: SPFI;

export const getSP = (context?: WebPartContext | ListViewCommandSetContext): SPFI => {
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