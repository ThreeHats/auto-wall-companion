import { moduleId } from './constants';
import { WallUtils } from './module';

/**
 * Dialog for managing wall import/export operations
 */
export class WallManagementDialog extends Dialog {
  constructor() {
    super(
      {
        title: "Wall Management",
        content: `
          <h2>Import Walls</h2>
          <div class="form-group">
            <button class="import-clipboard">Import from Clipboard</button>
            <button class="import-file">Import from File</button>
          </div>
          <hr>
          <h2>Export Walls</h2>
          <div class="form-group">
            <button class="export-clipboard">Export to Clipboard</button>
            <button class="export-file">Export to File</button>
          </div>
        `,
        buttons: {
          close: {
            icon: '<i class="fas fa-times"></i>',
            label: "Close"
          }
        },
        default: "close",
      },
      {
        id: `${moduleId}-wall-management-dialog`,
        classes: ["auto-wall-dialog"]
      }
    );
  }

  /**
   * @override
   */
  override activateListeners(html: JQuery) {
    super.activateListeners(html);

    html.find('.import-clipboard').click(() => {
      WallUtils.importWallsFromClipboard();
    });

    html.find('.import-file').click(() => {
      WallUtils.importWallsFromFile();
    });

    html.find('.export-clipboard').click(() => {
      WallUtils.exportWallsToClipboard();
    });

    html.find('.export-file').click(() => {
      WallUtils.exportWallsToFile();
    });
  }
}
