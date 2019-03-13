import { browser, by, element } from 'protractor';

export class NRTGraphPage {
  navigateTo() {
    return browser.get('/');
  }

  getTitleText() {
    return browser.getTitle();
    // return element(by.xpath('//title')).getText();
  }
}
