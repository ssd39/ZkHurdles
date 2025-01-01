import { WalletType } from '../api/admin/dataSource/NodeDataSource';

export const getWalletType = (walletType: string): WalletType => {
  switch (walletType) {
    case 'argentX':
      return WalletType.STARKNET({ walletName: 'argentX' });
    default:
      return WalletType.STARKNET({ walletName: 'metamask' });
  }
};
