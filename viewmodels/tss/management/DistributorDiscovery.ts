import { action, makeObservable, observable, runInAction } from 'mobx';

import Bonjour from '../../../common/p2p/Bonjour';
import EventEmitter from 'eventemitter3';
import { KeyDistributionService } from '../Constants';
import { Service } from 'react-native-zeroconf';
import { atob } from 'react-native-quick-base64';
import { getDeviceBasicInfo } from '../../../common/p2p/Utils';

export const LanServices = {
  ShardsDistribution: 'shards-distribution',
  ShardsAggregation: 'shards-aggregation',
};

export function handleRawService(service: Service) {
  try {
    service.txt.info = JSON.parse(atob(service.txt.info));
  } catch (error) {}

  switch (service.txt?.['func']) {
    case LanServices.ShardsDistribution:
      return { shardsDistribution: service };
    case LanServices.ShardsAggregation:
      return { shardsAggregation: service };
  }

  return {};
}

class DistributorDiscovery extends EventEmitter<{}> {
  shardsDistributors: Service[] = [];

  constructor() {
    super();

    makeObservable(this, { shardsDistributors: observable });
    Bonjour.on('resolved', this.onResolved);
    Bonjour.on('update', this.onUpdate);
  }

  onUpdate = () => {
    const all = Object.getOwnPropertyNames(Bonjour.getAllServices() || {});
    runInAction(() => (this.shardsDistributors = this.shardsDistributors.filter((s) => all.find((name) => name === s.name))));
  };

  onResolved = (raw: Service) => {
    const { shardsDistribution: service } = handleRawService(raw);
    if (!service) return;

    runInAction(() => this.shardsDistributors.push(service));
  };

  scan() {
    Bonjour.scan(KeyDistributionService);
  }

  stop() {
    Bonjour.stopScan();
  }
}

export default new DistributorDiscovery();
