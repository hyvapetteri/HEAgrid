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
    StartPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Settings',
            cancelButtonText: 'Cancel',
            actions: ['Calibrate']
        }).then(function (result) {
            console.log(result);
            if (result == "Calibrate") {
                return _this.routerExtensions.navigate(['/calibration']);
            }
        }).catch(function (err) { return console.log(err); });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFDdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCx3REFBK0Q7QUFRL0Q7SUFNRSxtQkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDO1FBRGxDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRXBELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQztJQUN2QyxDQUFDO0lBRUQsbUNBQWUsR0FBZjtRQUFBLGlCQWdDQztRQS9CQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUV0QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQTtRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBRTFDLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3hELFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxRQUFnQjtZQUMxQyxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUNuQixLQUFLLEVBQUUsWUFBWTtnQkFDbkIsT0FBTyxFQUFFLHlCQUF5QixHQUFHLEtBQUksQ0FBQyxJQUFJO2dCQUM5QyxZQUFZLEVBQUUsSUFBSTthQUNuQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxtQ0FBZSxHQUFmO1FBQUEsaUJBV0M7UUFWQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ2IsS0FBSyxFQUFFLFVBQVU7WUFDakIsZ0JBQWdCLEVBQUUsUUFBUTtZQUMxQixPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUM7U0FDdkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQWM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxDQUFDLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFoQixDQUFnQixDQUFDLENBQUM7SUFDcEMsQ0FBQztJQTNEVSxTQUFTO1FBTnJCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsUUFBUSxFQUFFLFlBQVk7WUFDdEIsV0FBVyxFQUFFLGNBQWM7WUFDM0IsU0FBUyxFQUFFLENBQUMsYUFBYSxDQUFDO1NBQzNCLENBQUM7eUNBT3FDLHlCQUFlO1lBQ2QseUJBQWdCO09BUDNDLFNBQVMsQ0E2RHJCO0lBQUQsZ0JBQUM7Q0FBQSxBQTdERCxJQTZEQztBQTdEWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9maWxlLXN5c3RlbVwiO1xuaW1wb3J0IHsgUm91dGVyRXh0ZW5zaW9ucyB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcblxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3Nlc3Npb24vc2Vzc2lvbic7XG5cbkBDb21wb25lbnQoe1xuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICBzZWxlY3RvcjogJ3BhZ2Utc3RhcnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vc3RhcnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3N0YXJ0LmNzcyddXG59KVxuZXhwb3J0IGNsYXNzIFN0YXJ0UGFnZSB7XG4gIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuXG4gIHByaXZhdGUgc3VibWl0dGVkOiBib29sZWFuO1xuICBwcml2YXRlIG5hbWVfaW52YWxpZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNlc3Npb25Qcm92aWRlcjogU2Vzc2lvblByb3ZpZGVyLFxuICAgICAgICAgICAgICBwcml2YXRlIHJvdXRlckV4dGVuc2lvbnM6IFJvdXRlckV4dGVuc2lvbnMpIHtcblxuICAgIHRoaXMuc3VibWl0dGVkID0gZmFsc2U7XG4gICAgdGhpcy5uYW1lX2ludmFsaWQgPSB0cnVlO1xuICAgIHRoaXMubmFtZSA9IHNlc3Npb25Qcm92aWRlci51c2VybmFtZTtcbiAgfVxuXG4gIHN0YXJ0RXZhbHVhdGlvbigpIHtcbiAgICB0aGlzLnN1Ym1pdHRlZCA9IHRydWU7XG5cbiAgICBpZiAoIXRoaXMubmFtZSkge1xuICAgICAgdGhpcy5uYW1lX2ludmFsaWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5hbWVfaW52YWxpZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm5hbWVfaW52YWxpZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zZXNzaW9uUHJvdmlkZXIudXNlcm5hbWUgPSB0aGlzLm5hbWU7XG5cbiAgICBsZXQgZG9jc0ZvbGRlciA9IGZzLmtub3duRm9sZGVycy5kb2N1bWVudHMoKTtcbiAgICBjb25zb2xlLmxvZyhkb2NzRm9sZGVyLnBhdGgpO1xuICAgIGxldCBmaWxlSGFuZGxlID0gZG9jc0ZvbGRlci5nZXRGaWxlKCdwYXJ0aWNpcGFudHMudHh0Jyk7XG4gICAgZmlsZUhhbmRsZS5yZWFkVGV4dCgpLnRoZW4oKHN1YmplY3RzOiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBmdWxsTGlzdCA9IHN1YmplY3RzLmNvbmNhdCgnc3ViajogJyArIHRoaXMubmFtZSArICdcXG4nKTtcbiAgICAgIHJldHVybiBmaWxlSGFuZGxlLndyaXRlVGV4dChmdWxsTGlzdCk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZGlhbG9ncy5hbGVydCh7XG4gICAgICAgIHRpdGxlOiAnVGhhbmsgeW91IScsXG4gICAgICAgIG1lc3NhZ2U6ICdZb3VyIHBhcnRpY2lwYW50IElEIGlzICcgKyB0aGlzLm5hbWUsXG4gICAgICAgIG9rQnV0dG9uVGV4dDogJ09LJ1xuICAgICAgfSk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLnJvdXRlckV4dGVuc2lvbnMubmF2aWdhdGUoW1wiL3ZvbHVtZVwiXSk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfSk7XG4gIH1cblxuICBzaG93QWN0aW9uU2hlZXQoKSB7XG4gICAgZGlhbG9ncy5hY3Rpb24oe1xuICAgICAgdGl0bGU6ICdTZXR0aW5ncycsXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiAnQ2FuY2VsJyxcbiAgICAgIGFjdGlvbnM6IFsnQ2FsaWJyYXRlJ11cbiAgICB9KS50aGVuKChyZXN1bHQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIGlmIChyZXN1bHQgPT0gXCJDYWxpYnJhdGVcIikge1xuICAgICAgICByZXR1cm4gdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFsnL2NhbGlicmF0aW9uJ10pO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKTtcbiAgfVxuXG59XG4iXX0=