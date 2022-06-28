import { sp } from "@pnp/sp";


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
  return await sp.web.siteUsers.getByLoginName(loginName).get();
};

export const GetUsersByLoginName = async (users: Array<any>): Promise<Array<any>> => {
  let returnOutput: Array<any> = [];
  for (let index = 0; index < users.length; index++) {
    const user = users[index];
    returnOutput.push(await GetUserByLoginName(user.loginName));
  }
  return returnOutput;
};