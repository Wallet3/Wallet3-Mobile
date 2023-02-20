import { ButtonV2, Placeholder, SafeViewContainer } from '../../components';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { openGlobalPasspad, openShardsAggregator } from '../../common/Modals';
import { secureColor, verifiedColor } from '../../constants/styles';

import AddDevices from './modals/AddDevices';
import DeviceInfo from '../../modals/tss/components/DeviceInfo';
import { FadeInDownView } from '../../components/animations';
import IllustrationSafe from '../../assets/illustrations/misc/safe.svg';
import ModalizeContainer from '../../modals/core/ModalizeContainer';
import { MultiSigKeyDeviceInfo } from '../../models/entities/MultiSigKey';
import { MultiSigWallet } from '../../viewmodels/wallet/MultiSigWallet';
import { Portal } from 'react-native-portalize';
import { ShardsAggregator } from '../../viewmodels/tss/ShardsAggregator';
import Theme from '../../viewmodels/settings/Theme';
import TrustedDevice from './modals/TrustedDevice';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { sleep } from '../../utils/async';
import { useModalize } from 'react-native-modalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default observer(({ wallet }: { wallet: MultiSigWallet }) => {
  const { t } = i18n;
  const { appColor, secondaryTextColor, textColor } = Theme;
  const { bottom } = useSafeAreaInsets();
  const { trustedDevices, trustedDeviceCount } = wallet;
  const [selectedDevice, setSelectedDevice] = useState<MultiSigKeyDeviceInfo>();
  const { ref: trustedDevicesModal, close: closeTrustedDeviceModal, open: openTrustedDeviceModal } = useModalize();
  const { ref: addDevicesModal, close: closeAddDevices, open: openAddDevices } = useModalize();

  const aggregateShards = async () => {
    let vm: ShardsAggregator | undefined;

    const auth = async (pin?: string) => {
      vm = await wallet.requestShardsAggregator({ rootShard: true, autoStart: true }, pin);
      return vm ? true : false;
    };

    if (!(await openGlobalPasspad({ onAutoAuthRequest: auth, onPinEntered: auth, fast: true }))) return;

    await sleep(200);

    openShardsAggregator(vm!);
  };

  return (
    <SafeViewContainer style={{ padding: 0, paddingBottom: 0 }} paddingHeader={false}>
      <ScrollView
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottom || 16, paddingHorizontal: 16 }}
      >
        <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 24, marginBottom: 48 }}>
          <IllustrationSafe width={150} height={150} />
        </View>

        <View style={{ flex: 1, marginBottom: 4 }}>
          <View style={styles.itemContainer}>
            <View style={styles.titleContainer}>
              <Text style={{ color: textColor, ...styles.btnTxt }}>Security</Text>
              <Text style={{ color: secureColor, ...styles.btnTxt }}>Safe</Text>
            </View>

            <Text style={{ color: secondaryTextColor, ...styles.subtitle }}>
              {t('multi-sig-screen-tip-security-overview', { m: wallet.threshold, n: wallet.trustedDeviceCount })}
            </Text>
          </View>

          <TouchableOpacity style={styles.itemContainer}>
            <View style={styles.titleContainer}>
              <Text style={{ color: textColor, ...styles.btnTxt }}>Confirmations</Text>
              <Text style={{ color: verifiedColor, ...styles.btnTxt }}>
                {`${wallet.threshold} of ${wallet.trustedDeviceCount}`}
              </Text>
            </View>

            <Text style={{ color: secondaryTextColor, ...styles.subtitle }}>{t('multi-sig-screen-tip-modify-threshold')}</Text>
          </TouchableOpacity>

          <View style={styles.itemContainer}>
            <View style={{ marginBottom: 4, ...styles.titleContainer }}>
              <Text style={{ color: textColor, ...styles.btnTxt }}>Trusted Devices</Text>
              <Placeholder />
            </View>

            {trustedDevices.map((device, i) => {
              return (
                <FadeInDownView key={device.globalId} delay={i * 50}>
                  <TouchableOpacity
                    style={{ paddingVertical: 8 }}
                    onPress={() => {
                      setSelectedDevice(device);
                      openTrustedDeviceModal();
                    }}
                  >
                    <DeviceInfo info={device} />
                  </TouchableOpacity>
                </FadeInDownView>
              );
            })}
          </View>
        </View>

        <ButtonV2 title={t('button-add-devices')} onPress={openAddDevices} />
      </ScrollView>

      <Portal>
        <ModalizeContainer ref={trustedDevicesModal}>
          {selectedDevice && (
            <TrustedDevice
              close={closeTrustedDeviceModal}
              device={selectedDevice}
              onDeleteDevice={(d) => wallet.removeTrustedDevice(d)}
              disableRemove={trustedDeviceCount <= wallet.threshold}
            />
          )}
        </ModalizeContainer>

        <ModalizeContainer ref={addDevicesModal}>
          <AddDevices wallet={wallet} close={closeAddDevices} />
        </ModalizeContainer>
      </Portal>
    </SafeViewContainer>
  );
});

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 24,
  },

  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  btnTxt: {
    fontSize: 20,
    fontWeight: '500',
  },

  subtitle: {
    marginEnd: 72,
    fontSize: 12.5,
    marginTop: 5,
  },
});
