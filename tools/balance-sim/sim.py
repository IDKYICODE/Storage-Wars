# throwaway balance sim: bots play Bidder Battle with my proposed deck
import random, statistics as st, itertools, sys
J=[-100]*6+[-200]*5+[-300]*4+[-400]*2+[-500]*2            # 19 junk
C=[0]*4+[100]*3+[200]*3+[300]*4+[500]*4+[700]*4          # 22 common
V=[2000,2500,3000,3500,4000,5000,6000,8000,9000]          # 9 valuable
U=[12000,15000]                                           # 2 unique
H=['H']*4                                                 # 4 havoc
DECK=[('J',x) for x in J]+[('C',x) for x in C]+[('V',x) for x in V]+[('U',x) for x in U]+[('H',0) for _ in H]
assert len(DECK)==56
UNITS={ 'Locker':(1,False,'never',3),'Small':(2,False,'after',3),'Medium':(3,False,'before',4),
        'Large':(4,True,'after',3),'Jumbo':(5,True,'before',3)}
UL=[n for n,(k,f,p,c) in UNITS.items() for _ in range(c)]; assert len(UL)==16
nonH=[v for t,v in DECK if t!='H']; MEAN=sum(nonH)/len(nonH)

SKILL=False
def est(items,known):
    """EV of unit: known = list of idx revealed to this bidder"""
    if any(items[i][0]=='H' for i in known): return 0
    unk=len(items)-len(known)
    pn=1.0; rem=56-len(known)   # rough: havoc 4/56 per unknown card
    for _ in range(unk): pn*=1-4/56
    return pn*(sum(items[i][1] for i in known)+unk*MEAN)

def game(n,rng):
    cash=[5000]*n; inv=[[] for _ in range(n)]; deck=DECK[:]; rng.shuffle(deck)
    units=UL[:]; rng.shuffle(units); log=[]
    order=[(a)%n for a in range(2*n)]
    for rd,a in enumerate(order):
        u=units.pop(); k,flip,peek,_=UNITS[u]; items=[deck.pop() for _ in range(k)]
        known_all=[]
        if flip:
            fi=rng.randrange(k); known_all=[fi]
            if items[fi][0]=='H': log.append((u,'void_flip',0,0)); continue
        bidders=[]
        for b in range(n):
            if b==a: continue
            kn=list(known_all)
            if peek=='before':
                un=[i for i in range(k) if i not in kn]
                if un: kn.append(rng.choice(un))
                if any(items[i][0]=='H' for i in kn): continue
            e=est(items,kn)
            if peek=='after':   # decide on prior, then peek after paying
                e2=e
            margin=rng.uniform(0.0,0.05) if (SKILL and b==0) else rng.uniform(0.0,0.35)
            mb=int((e*(1-margin))//100*100)
            cap=cash[b]+sum(v for t,v in inv[b] if v>0)-100
            mb=min(mb,cap)
            if mb>=200 and cash[b]>=100:
                cash[b]-=100; cash[a]+=100
                if peek=='after':
                    un=[i for i in range(k) if i not in kn]
                    if un: kn.append(rng.choice(un))
                    if any(items[i][0]=='H' for i in kn): bidders.append((b,0)); continue
                    e=est(items,kn); mb=min(int((e*(1-margin))//100*100),cap)
                bidders.append((b,max(mb,100) if e>0 else 0))
        bidders=[x for x in bidders if x[1]>=100]
        if not bidders: log.append((u,'nobuy',0,0)); continue
        bidders.sort(key=lambda x:-x[1]); w,top=bidders[0]
        price=100 if len(bidders)==1 else min(top,bidders[1][1]+100)
        # pay cash first, then lowest positive items
        pay=min(cash[w],price); cash[w]-=pay; cash[a]+=pay; short=price-pay
        if short>0:
            for it in sorted([x for x in inv[w] if x[1]>0],key=lambda x:x[1]):
                if short<=0: break
                inv[w].remove(it); inv[a].append(it); short-=it[1]
        if any(t=='H' for t,_ in items): log.append((u,'void_won',price,0)); 
        else:
            inv[w]+= items; log.append((u,'sold',price,sum(v for _,v in items)))
        if any(t=='H' for t,_ in items): pass
    wealth=[cash[i]+sum(v for _,v in inv[i]) for i in range(n)]
    return wealth,log

def run(n,G=4000,seed=1):
    rng=random.Random(seed); wins=[0]*n; sw=[[] for _ in range(n)]; prof={u:[] for u in UNITS}; ev={u:[] for u in UNITS}
    out={'void_flip':0,'void_won':0,'nobuy':0,'sold':0}; spread=[]
    for _ in range(G):
        w,log=game(n,rng); m=max(w); ws=[i for i,x in enumerate(w) if x==m]; wins[rng.choice(ws)]+=1
        for i,x in enumerate(w): sw[i].append(x)
        spread.append(m-min(w))
        for u,res,p,val in log:
            out[res]+=1
            if res=='sold': prof[u].append(val-p)
    tot=sum(out.values())
    print(f"\n=== {n} players, {G} games ===")
    print("win% by seat (seat0 = first auctioneer):",[round(100*x/G,1) for x in wins],"fair=",round(100/n,1))
    print("mean final wealth by seat:",[round(st.mean(s)) for s in sw])
    print("median winner-loser gap:",round(st.median(spread)))
    print("round outcomes %:",{k:round(100*v/tot,1) for k,v in out.items()})
    print("winning bidder profit per unit (value-price) mean/median:",{u:(round(st.mean(p)),round(st.median(p))) for u,p in prof.items() if p})

# deck stats
print("deck total value",sum(v for _,v in DECK),"mean/item(incl havoc=0)",round(sum(v for _,v in DECK)/56))
rng=random.Random(7)
print("unit value stats (single unit, havoc voids it):")
for u,(k,f,p,c) in UNITS.items():
    vals=[]; voids=0
    for _ in range(40000):
        its=rng.sample(DECK,k)
        if any(t=='H' for t,_ in its): vals.append(0); voids+=1
        else: vals.append(sum(v for _,v in its))
    print(f"  {u:7s} items={k} EV={round(st.mean(vals)):6d} SD={round(st.pstdev(vals)):6d} void={100*voids/40000:4.1f}% P(<0)={100*sum(v<0 for v in vals)/40000:4.1f}% P(>=10k)={100*sum(v>=10000 for v in vals)/40000:4.1f}%")
for n in (3,4,5,7): run(n)
SKILL=True
print('##### SKILL TEST: seat0 bids sharper (should win MORE than fair) #####')
for n in (4,5): run(n,G=3000,seed=5)
