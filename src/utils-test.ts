export class User {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  type?: string;

  groups: Array<any> = new Array<any>();

  constructor(firstName?: string, lastName?: string, phoneNumber?: string) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.phoneNumber = phoneNumber;

    this.type = 'User'; // Use to test default value scenario
  }

  /**
   * Use to test runtime access to the created object context
   * @param {} group
   * @param {} externalTrigger
   */
  addToGroup(group: any, externalTrigger: any) {
    this.groups.push(group);
    externalTrigger(this, group);
  }
}

export interface MockData {
  firstName: string;
  lastName: string;
  age: number;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
  };
  phoneNumber: [
    {
      type: string;
      number: string;
    },
    {
      type: string;
      number: string;
    }
  ];
}
