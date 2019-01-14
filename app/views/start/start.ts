import { Component } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as fs from "tns-core-modules/file-system";
import { RouterExtensions } from "nativescript-angular/router";

import { SessionProvider } from '../../shared/session/session';

@Component({
  moduleId: module.id,
  selector: 'page-start',
  templateUrl: './start.html',
  styleUrls: ['./start.css']
})
export class StartPage {
  private name: string;

  private submitted: boolean;
  private name_invalid: boolean;

  constructor(private sessionProvider: SessionProvider,
              private routerExtensions: RouterExtensions) {

    this.submitted = false;
    this.name_invalid = true;
    this.name = sessionProvider.username;
  }

  startEvaluation() {
    this.submitted = true;

    if (!this.name) {
      this.name_invalid = true;
    } else {
      this.name_invalid = false;
    }

    if (this.name_invalid) {
      return
    }

    this.sessionProvider.username = this.name;

    let docsFolder = fs.knownFolders.documents();
    console.log(docsFolder.path);
    let fileHandle = docsFolder.getFile('participants.txt');
    fileHandle.readText().then((subjects: string) => {
      let fullList = subjects.concat('subj: ' + this.name + '\n');
      return fileHandle.writeText(fullList);
    }).then(() => {
      return dialogs.alert({
        title: 'Thank you!',
        message: 'Your participant ID is ' + this.name,
        okButtonText: 'OK'
      });
    }).then(() => {
      this.routerExtensions.navigate(["/volume"]);
    }).catch(err => {
      console.log(err);
    });
  }

}
