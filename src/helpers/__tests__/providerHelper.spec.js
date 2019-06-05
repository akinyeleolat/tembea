import ProviderHelper from '../providerHelper';
import { returnedObj, enteredProvider } from '../__mocks__/providersMock';

describe('Providers Helper', () => {
  it('return paginated provider data', () => {
    const result = ProviderHelper.paginateData(1, 1, 3, 100, enteredProvider, 'providers');
    expect(result).toEqual(returnedObj);
  });
  it('it should convert an array of provider details into provider lable value pairs', (done) => {
    const [providerName, slackId, providerUserId] = ['DbrandTaxify', 1, 'UXTMIE'];
    const providerMock = {
      name: providerName,
      user: { slackId },
      providerUserId,
    };
    const providersMock = [providerMock];
    const valuePairsData = ProviderHelper.generateProvidersLabel(providersMock);
    const expectedData = [
      {
        label: providerName,
        value: [providerName, providerUserId, slackId].toString()
      }
    ];
    expect(valuePairsData).toEqual(expectedData);
    done();
  });
});
