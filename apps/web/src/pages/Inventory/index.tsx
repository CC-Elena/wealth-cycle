import React, { useEffect, useMemo, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import styles from './index.module.css';
import { LotActionSheet } from './LotActionSheet';
import { StockInSheet } from './StockInSheet';
import sheetStyles from './sheets.module.css';

const Inventory = () => {
  const { templates, stations, lots, fetchData } = useInventoryStore();
  const [viewMode, setViewMode] = useState<'area' | 'item'>('area');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sheet States
  const [stockInVisible, setStockInVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [actionType, setActionType] = useState<'consume' | 'discard'>(
    'consume',
  );
  const [actionLot, setActionLot] = useState<any>(null); // 保存正在处理的 lot 上下文

  const tplMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of templates) map[t.id] = t;
    return map;
  }, [templates]);

  const activeLots = useMemo(
    () => lots.filter((l) => l.remainingQuantity > 0),
    [lots],
  );

  const calcDaysLeft = (expireIso: string) => {
    const diff = new Date(expireIso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const areaViewData = useMemo(() => {
    if (viewMode !== 'area') return [];
    return stations
      .map((station) => {
        const stationLots = activeLots.filter(
          (l) => l.stationId === station.id,
        );
        return { ...station, lots: stationLots };
      })
      .filter((s) => s.lots.length > 0);
  }, [viewMode, stations, activeLots]);

  const itemViewData = useMemo(() => {
    if (viewMode !== 'item') return [];
    return templates
      .map((tpl) => {
        const itemLots = activeLots.filter((l) => l.itemId === tpl.id);
        const totalQty = itemLots.reduce(
          (acc, l) => acc + l.remainingQuantity,
          0,
        );
        let dangerCount = 0;
        itemLots.forEach((l) => {
          if (calcDaysLeft(l.expireDate) <= 3) dangerCount++;
        });
        return { ...tpl, lots: itemLots, totalQty, dangerCount };
      })
      .filter((t) => t.totalQty > 0);
  }, [viewMode, templates, activeLots]);

  const openAction = (type: 'consume' | 'discard', lot: any, tpl: any) => {
    setActionType(type);
    setActionLot({ ...lot, tplName: tpl.name, baseUnit: tpl.baseUnit });
    setActionVisible(true);
  };

  const renderLotCard = (lot: any, tpl: any) => {
    const daysLeft = calcDaysLeft(lot.expireDate);
    const isDanger = daysLeft <= 3;
    const isWarning = daysLeft > 3 && daysLeft <= 7;

    const percent = Math.min(
      100,
      Math.max(0, (daysLeft / tpl.defaultShelfLifeDays) * 100),
    );
    let uClass = styles.uBarFill;
    if (isDanger) uClass += ` ${styles.uBarDanger}`;
    else if (isWarning) uClass += ` ${styles.uBarWarning}`;

    return (
      <div key={lot.id} className={styles.lotCard}>
        <div className={styles.lotTop}>
          <div className={styles.lotIcon}>{tpl.icon}</div>
          <div
            className={`${styles.lotBadge} ${isDanger ? styles.lotBadgeDanger : ''}`}
          >
            {isDanger ? '即将过期' : '健康'}
          </div>
        </div>
        <div className={styles.lotName}>{tpl.name}</div>
        <div className={styles.lotQty}>
          {lot.remainingQuantity} {tpl.baseUnit}
        </div>

        <div className={styles.uBarContainer}>
          <div className={uClass} style={{ width: `${percent}%` }} />
        </div>

        <div className={styles.lotExpInfo}>
          <span>剩 {daysLeft} 天</span>
          <span>
            {lot.storageMode === 'frozen'
              ? '冷冻'
              : lot.storageMode === 'refrigerated'
                ? '冷藏'
                : '常温'}
          </span>
        </div>

        {/* Action Bar for lot processing */}
        <div className={sheetStyles.lotActionBar}>
          <div
            className={sheetStyles.lotActionBtn}
            onClick={() => openAction('consume', lot, tpl)}
          >
            消 耗
          </div>
          <div
            className={sheetStyles.lotActionBtn}
            onClick={() => openAction('discard', lot, tpl)}
          >
            丢 弃
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`page-container ${styles.container}`}>
      <div className={styles.headerRow}>
        <div className={styles.title}>库存管理</div>
        <div
          className={styles.navAction}
          onClick={() => setStockInVisible(true)}
        >
          ⊕
        </div>
      </div>

      <div className={styles.viewToggle}>
        <div
          className={`${styles.toggleBg} ${viewMode === 'item' ? styles.slideRight : ''}`}
        />
        <div
          className={`${styles.toggleBtn} ${viewMode === 'area' ? styles.toggleActive : ''}`}
          onClick={() => setViewMode('area')}
        >
          按区域看
        </div>
        <div
          className={`${styles.toggleBtn} ${viewMode === 'item' ? styles.toggleActive : ''}`}
          onClick={() => setViewMode('item')}
        >
          按物品看
        </div>
      </div>

      {activeLots.length === 0 && (
        <div className={styles.emptyState}>
          系统暂无任何库存，点击顶部加号去入库吧。
        </div>
      )}

      {viewMode === 'area' &&
        areaViewData.map((station) => (
          <div key={station.id} className={styles.stationGroup}>
            <div className={styles.stationHeader}>
              <div className={styles.stationIcon}>{station.icon}</div>
              <div className={styles.stationName}>{station.name}</div>
              <div className={styles.stationCount}>
                {station.lots.length} 批次
              </div>
            </div>
            <div className={styles.lotGrid}>
              {station.lots.map((lot) =>
                renderLotCard(lot, tplMap[lot.itemId]),
              )}
            </div>
          </div>
        ))}

      {viewMode === 'item' &&
        itemViewData.map((aggr) => (
          <div key={aggr.id} className={styles.itemAggrGroup}>
            <div className={styles.itemAggrIcon}>{aggr.icon}</div>
            <div className={styles.itemAggrInfo}>
              <div className={styles.itemAggrName}>{aggr.name}</div>
              <div className={styles.itemAggrTotal}>
                库存充裕: {aggr.totalQty} {aggr.baseUnit}
              </div>
              <div className={styles.itemAggrSub}>
                散落在 {aggr.lots.length} 个不同批次中 •{' '}
                {aggr.dangerCount > 0 ? (
                  <span style={{ color: 'var(--color-danger)' }}>
                    {aggr.dangerCount} 批高风险！
                  </span>
                ) : (
                  '无临期风险'
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Sheets Mount */}
      <StockInSheet
        visible={stockInVisible}
        onClose={() => setStockInVisible(false)}
      />
      {actionLot && (
        <LotActionSheet
          visible={actionVisible}
          onClose={() => setActionVisible(false)}
          actionType={actionType}
          lotId={actionLot.id}
          tplName={actionLot.tplName}
          baseUnit={actionLot.baseUnit}
          maxQty={actionLot.remainingQuantity}
        />
      )}
    </div>
  );
};

export default Inventory;
