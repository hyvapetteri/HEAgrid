"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var router_1 = require("nativescript-angular/router");
var environment_1 = require("../../config/environment");
var volumeobserver_1 = require("../../shared/volumeobserver");
var session_1 = require("../../shared/session/session");
var ExperimentListPage = /** @class */ (function () {
    function ExperimentListPage(sessionProvider, routerExtensions, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.page = page;
        this.listItems = [];
        this.listItems.push({ type: "header", text: "Start new experiment by selecting test frequency below" });
        for (var i = 0; i < environment_1.testfrequencies.length; i++) {
            var item = { type: "test" };
            item.text = "" + environment_1.testfrequencies[i].label;
            item.frequency = environment_1.testfrequencies[i].value;
            this.listItems.push(item);
        }
        this.listItems.push({ type: "header", text: "Previous experiments in the current session" });
        var experimentList = sessionProvider.getExperiments();
        for (var i = 0; i < experimentList.length; i++) {
            var item = { type: "history" };
            item.text = "" + experimentList[i].testFrequency + " (" + experimentList[i].status + ")";
            item.experimentId = i + 1;
            this.listItems.push(item);
        }
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            _this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
            _this.masterVolumeObserver.setCallback(function (obj) {
                dialogs.alert({
                    title: "Volume changed!",
                    message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                    okButtonText: "OK"
                }).then(function () {
                    return _this.routerExtensions.navigate(["/volume"], { clearHistory: true });
                }).catch(function (err) { return console.log(err); });
            });
            audioSession.addObserverForKeyPathOptionsContext(_this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        });
        this.page.on("navigatingFrom", function (data) {
            console.log("removing volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    ExperimentListPage.prototype.handleTap = function (tapEvent) {
        if (this.listItems[tapEvent.index].type === "test") {
            var pickedFreq = this.listItems[tapEvent.index].frequency;
            this.sessionProvider.startExperiment(pickedFreq);
            return this.routerExtensions.navigate(["/threshold"], { clearHistory: true }).catch(function (err) {
                console.log(err);
            });
        }
        else if (this.listItems[tapEvent.index].type === "history") {
            var pickedExperiment = this.listItems[tapEvent.index].experimentId;
            return this.routerExtensions.navigate(["/gridplot", pickedExperiment]).catch(function (err) {
                console.log(err);
            });
        }
    };
    ExperimentListPage.prototype.templateSelector = function (item, index, items) {
        return item.type;
    };
    ExperimentListPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Send the results',
            message: 'version 0.1',
            cancelButtonText: 'Cancel',
            actions: ['Calibrate', 'Send with email', 'Quit']
        }).then(function (result) {
            console.log(result);
            if (result == "Calibrate") {
                return _this.routerExtensions.navigate(['/calibration']);
            }
            else if (result == "Quit") {
                _this.sessionProvider.resetSession();
                return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
            }
        }).catch(function (err) { return console.log(err); });
    };
    ExperimentListPage.prototype.sendResults = function () {
    };
    ExperimentListPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-experimentlist',
            templateUrl: './experimentlist.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            page_1.Page])
    ], ExperimentListPage);
    return ExperimentListPage;
}());
exports.ExperimentListPage = ExperimentListPage;
