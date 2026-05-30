// index.ts — PCF Entry Point for ScheduleBoard Control
// Implements StandardControl<IInputs, IOutputs> pattern

import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ScheduleBoard } from "./ScheduleBoard";

export class ScheduleBoardControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container: HTMLDivElement;
  private _context: ComponentFramework.Context<IInputs>;
  private _notifyOutputChanged: () => void;

  /**
   * Initializes the control instance. Called once when the control is first instantiated.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;

    // Set the container to full height
    this._container.style.height = "100%";
    this._container.style.width = "100%";
    this._container.style.overflow = "hidden";

    // Mount the React component
    ReactDOM.render(
      React.createElement(ScheduleBoard),
      this._container
    );
  }

  /**
   * Called when any value in the property bag has changed.
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this._context = context;
    // Re-render on context changes (data refresh, resize, etc.)
    ReactDOM.render(
      React.createElement(ScheduleBoard),
      this._container
    );
  }

  /**
   * Returns an object based on nomenclature defined in manifest.
   * Return null if no output changes.
   */
  public getOutputs(): IOutputs {
    return {};
  }

  /**
   * Called when the control is to be removed from the DOM tree.
   * Controls should use this call for cleanup (i.e. cancelling async ops, removing event listeners).
   */
  public destroy(): void {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}