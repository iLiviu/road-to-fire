import { fakeAsync, tick } from '@angular/core/testing';
import { Debounce, debounce } from './debounce.decorator';

class TestService {
  public callCount = 0;
  public lastArg: string | null = null;

  @Debounce(50)
  testMethod(arg: string) {
    this.callCount++;
    this.lastArg = arg;
  }

  @debounce(50)
  testAliasedMethod() {
    this.callCount++;
  }
}

describe('Debounce Decorator', () => {
  let instance: TestService;

  beforeEach(() => {
    instance = new TestService();
  });

  it('should debounce rapid calls to the decorated method', fakeAsync(() => {
    instance.testMethod('call 1');
    instance.testMethod('call 2');
    instance.testMethod('call 3');

    expect(instance.callCount).toBe(0);

    tick(50);

    expect(instance.callCount).toBe(1);
    expect(instance.lastArg).toBe('call 3');
  }));

  it('should support lowercase debounce export', fakeAsync(() => {
    instance.testAliasedMethod();
    instance.testAliasedMethod();

    expect(instance.callCount).toBe(0);

    tick(50);

    expect(instance.callCount).toBe(1);
  }));

  it('should keep debounce calls independent across separate class instances', fakeAsync(() => {
    const instanceA = new TestService();
    const instanceB = new TestService();

    instanceA.testMethod('A1');
    instanceB.testMethod('B1');

    tick(50);

    expect(instanceA.callCount).toBe(1);
    expect(instanceA.lastArg).toBe('A1');
    expect(instanceB.callCount).toBe(1);
    expect(instanceB.lastArg).toBe('B1');
  }));
});
