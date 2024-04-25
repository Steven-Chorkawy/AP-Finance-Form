import * as React from 'react';
import * as ReactDom from 'react-dom';

import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'FinanceApFormWebPartStrings';
// import { FinanceApForm, IFinanceApFormProps } from './components/FinanceApForm';
import { FinanceApForm2, IFinanceApForm2Props } from './components/FinanceApForm2';

// Import Bootstrap theme for kendo. 
import "@progress/kendo-theme-bootstrap/dist/all.css";

// Import Bootstrap
import './bootstrap.min.css';
import { getSP } from './MyHelperMethods';

export interface IFinanceApFormWebPartProps {
  description: string;
  defaultInvoiceLink: string;
}

export default class FinanceApFormWebPart extends BaseClientSideWebPart<IFinanceApFormWebPartProps> {
  constructor() {
    super();    
  }

  protected async onInit(): Promise<void> {
    super.onInit();
    getSP(this.context);
    return Promise.resolve();
  }

  public render(): void {
    const element: React.ReactElement<IFinanceApForm2Props> = React.createElement(
      FinanceApForm2,
      {
        description: this.properties.description,
        defaultInvoiceLink: this.properties.defaultInvoiceLink,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('defaultInvoiceLink', {
                  label:"Invoice Link"
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
