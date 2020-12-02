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

/**
 * Props interface for FinanceApForm component class.
 */
export interface IFinanceApFormProps {
  description: string;
}


export class FinanceApForm extends React.Component<IFinanceApFormProps, {}> {
  constructor(props) {
    super(props);
    
  }

  public render(): React.ReactElement<IFinanceApFormProps> {
    return (
      <div className={ styles.financeApForm }>
        <div className={ styles.container }>
          <div className={ styles.row }>
            <div className={ styles.column }>
              <span className={ styles.title }>Welcome to SharePoint!</span>
              <p className={ styles.subTitle }>Customize SharePoint experiences using Web Parts.</p>
              <p className={ styles.description }>{escape(this.props.description)}</p>
              <a href="https://aka.ms/spfx" className={ styles.button }>
                <span className={ styles.label }>Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
