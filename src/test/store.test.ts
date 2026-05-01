import { useApplicationStore } from '../lib/store';

describe('useApplicationStore', () => {
  beforeEach(() => {
    useApplicationStore.getState().resetStore();
  });

  it('has correct initial state', () => {
    const state = useApplicationStore.getState();
    expect(state.selectedStoreId).toBeNull();
    expect(state.selectedStoreName).toBe('');
    expect(state.lookup.nationalId).toBe('');
    expect(state.lookup.customerFound).toBe(false);
    expect(state.basicInfo.firstName).toBe('');
    expect(state.basicInfo.lastName).toBe('');
  });

  it('setSelectedStore updates store id and name', () => {
    const { setSelectedStore } = useApplicationStore.getState();
    setSelectedStore(1, 'Test Store');
    
    const state = useApplicationStore.getState();
    expect(state.selectedStoreId).toBe(1);
    expect(state.selectedStoreName).toBe('Test Store');
  });

  it('setLookup updates lookup data', () => {
    const { setLookup } = useApplicationStore.getState();
    setLookup({ nationalId: '12345', customerFound: true });
    
    const state = useApplicationStore.getState();
    expect(state.lookup.nationalId).toBe('12345');
    expect(state.lookup.customerFound).toBe(true);
  });

  it('setBasicInfo updates basic info', () => {
    const { setBasicInfo } = useApplicationStore.getState();
    setBasicInfo({ firstName: 'John', lastName: 'Doe', gender: 'Male' });
    
    const state = useApplicationStore.getState();
    expect(state.basicInfo.firstName).toBe('John');
    expect(state.basicInfo.lastName).toBe('Doe');
    expect(state.basicInfo.gender).toBe('Male');
  });

  it('setContactDetails updates contact details', () => {
    const { setContactDetails } = useApplicationStore.getState();
    setContactDetails({ 
      physicalAddress: '123 Main St', 
      mobileNumber: '+263123456789',
      emailAddress: 'john@example.com'
    });
    
    const state = useApplicationStore.getState();
    expect(state.contactDetails.physicalAddress).toBe('123 Main St');
    expect(state.contactDetails.mobileNumber).toBe('+263123456789');
    expect(state.contactDetails.emailAddress).toBe('john@example.com');
  });

  it('setEmploymentDetails updates richer employer details', () => {
    const { setEmploymentDetails } = useApplicationStore.getState();

    setEmploymentDetails({
      employerName: 'Employer Inc',
      isCivilServant: false,
      phoneNumber: '+263242123456',
      contactPerson: 'Mary Manager',
      emailAddress: 'hr@employer.test',
      physicalAddress: '789 Work Avenue, Harare',
    });

    const state = useApplicationStore.getState();
    expect(state.employmentDetails.employerName).toBe('Employer Inc');
    expect(state.employmentDetails.isCivilServant).toBe(false);
    expect(state.employmentDetails.phoneNumber).toBe('+263242123456');
    expect(state.employmentDetails.contactPerson).toBe('Mary Manager');
    expect(state.employmentDetails.emailAddress).toBe('hr@employer.test');
    expect(state.employmentDetails.physicalAddress).toBe('789 Work Avenue, Harare');
  });

  it('resetStore clears richer employer details', () => {
    const { setEmploymentDetails, resetStore } = useApplicationStore.getState();

    setEmploymentDetails({
      phoneNumber: '+263242123456',
      contactPerson: 'Mary Manager',
      emailAddress: 'hr@employer.test',
      physicalAddress: '789 Work Avenue, Harare',
    });

    resetStore();

    const state = useApplicationStore.getState();
    expect(state.employmentDetails.phoneNumber).toBe('');
    expect(state.employmentDetails.contactPerson).toBe('');
    expect(state.employmentDetails.emailAddress).toBe('');
    expect(state.employmentDetails.physicalAddress).toBe('');
  });

  it('resetStore resets all state', () => {
    const { setSelectedStore, setLookup, setBasicInfo, setContactDetails, resetStore } = useApplicationStore.getState();
    
    setSelectedStore(1, 'Test Store');
    setLookup({ nationalId: '12345', customerFound: true });
    setBasicInfo({ firstName: 'John', lastName: 'Doe' });
    setContactDetails({ physicalAddress: '123 Main St' });
    
    resetStore();
    
    const state = useApplicationStore.getState();
    expect(state.selectedStoreId).toBeNull();
    expect(state.lookup.nationalId).toBe('');
    expect(state.basicInfo.firstName).toBe('');
    expect(state.contactDetails.physicalAddress).toBe('');
  });

  it('addNotification adds notification', () => {
    const { addNotification } = useApplicationStore.getState();
    addNotification('Test message', 'success');
    
    const state = useApplicationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].message).toBe('Test message');
    expect(state.notifications[0].type).toBe('success');
  });

  it('setLastReference updates reference', () => {
    const { setLastReference } = useApplicationStore.getState();
    setLastReference('APP-2024-001');
    
    const state = useApplicationStore.getState();
    expect(state.lastReference).toBe('APP-2024-001');
  });
});
