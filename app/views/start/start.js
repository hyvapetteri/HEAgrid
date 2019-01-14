"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var session_1 = require("../../shared/session/session");
var StartPage = /** @class */ (function () {
    function StartPage(sessionProvider, routerExtensions) {
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.submitted = false;
        this.name_invalid = true;
        this.name = sessionProvider.username;
    }
    StartPage.prototype.startEvaluation = function () {
        var _this = this;
        this.submitted = true;
        if (!this.name) {
            this.name_invalid = true;
        }
        else {
            this.name_invalid = false;
        }
        if (this.name_invalid) {
            return;
        }
        this.sessionProvider.username = this.name;
        var docsFolder = fs.knownFolders.documents();
        console.log(docsFolder.path);
        var fileHandle = docsFolder.getFile('participants.txt');
        fileHandle.readText().then(function (subjects) {
            var fullList = subjects.concat('subj: ' + _this.name + '\n');
            return fileHandle.writeText(fullList);
        }).then(function () {
            return dialogs.alert({
                title: 'Thank you!',
                message: 'Your participant ID is ' + _this.name,
                okButtonText: 'OK'
            });
        }).then(function () {
            _this.routerExtensions.navigate(["/volume"]);
        }).catch(function (err) {
            console.log(err);
        });
    };
    StartPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-start',
            templateUrl: './start.html',
            styleUrls: ['./start.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions])
    ], StartPage);
    return StartPage;
}());
exports.StartPage = StartPage;
