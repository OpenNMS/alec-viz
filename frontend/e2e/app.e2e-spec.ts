import { NRTGraphPage } from './app.po';

describe('NRTGraph App', () => {
  let page: NRTGraphPage;

  beforeEach(() => {
    page = new NRTGraphPage();
  });

  it('should have a title', (done) => {
    page.navigateTo();
    page.getTitleText().then(title => {
      expect(title).toEqual('NRTGraph');
      done();
    });
  });
});
