'use strict';

function camelBrand(row){
  if(!row)return null;
  return {
    id:row.external_key||row.slug||String(row.id),
    storageId:String(row.id),
    slug:row.slug,
    name:row.name,
    city:row.city,
    country:row.country,
    description:row.description,
    website:row.website,
    status:row.status,
    metadata:row.metadata||{}
  };
}
function camelChannel(row){
  if(!row)return null;
  return {
    id:row.external_key||String(row.id),
    storageId:String(row.id),
    ownerType:row.owner_type,
    brandId:row.brand_external_key||row.brand_slug||null,
    storageBrandId:row.brand_id?String(row.brand_id):null,
    platform:row.platform,
    externalChannelId:row.external_channel_id,
    handle:row.handle,
    url:row.url,
    verificationMode:row.verification_mode,
    status:row.status,
    verifiedAt:row.verified_at,
    metadata:row.metadata||{}
  };
}
function camelMembership(row){
  if(!row)return null;
  return {
    id:String(row.id),
    userId:String(row.user_id),
    channelId:row.channel_external_key||String(row.channel_id),
    storageChannelId:String(row.channel_id),
    platform:row.platform,
    status:row.status,
    firstVerifiedAt:row.first_verified_at,
    providerJoinedAt:row.provider_joined_at,
    continuousSince:row.continuous_since,
    lastVerifiedAt:row.last_verified_at,
    lastLostAt:row.last_lost_at,
    proofSource:row.proof_source,
    proofDigest:row.proof_digest,
    metadata:row.metadata||{}
  };
}
function camelOffer(row,requirements){
  if(!row)return null;
  return {
    id:row.external_key||String(row.id),
    storageId:String(row.id),
    brandId:row.brand_external_key||row.brand_slug||String(row.brand_id),
    storageBrandId:String(row.brand_id),
    titleRu:row.title_ru,
    titleEn:row.title_en,
    descriptionRu:row.description_ru,
    descriptionEn:row.description_en,
    rewardType:row.reward_type,
    rewardValue:row.reward_value==null?null:Number(row.reward_value),
    rewardCurrency:row.reward_currency,
    minContinuousDays:Number(row.min_continuous_days||0),
    stockLimit:row.stock_limit==null?null:Number(row.stock_limit),
    perUserLimit:Number(row.per_user_limit||1),
    startsAt:row.starts_at,
    endsAt:row.ends_at,
    status:row.status,
    termsRu:row.terms_ru,
    termsEn:row.terms_en,
    audienceScope:row.audience_scope||{kind:'all_mfw'},
    createdAt:row.created_at,
    updatedAt:row.updated_at,
    requirements:(requirements||[]).map(r=>({
      id:String(r.id),
      type:r.requirement_type,
      channelId:r.channel_external_key||r.channel_id&&String(r.channel_id)||null,
      storageChannelId:r.channel_id?String(r.channel_id):null,
      minContinuousDays:Number(r.min_continuous_days||0),
      required:r.required!==false,
      sortOrder:Number(r.sort_order||100),
      metadata:r.metadata||{}
    }))
  };
}
function camelPost(row){
  if(!row)return null;
  return {
    id:row.external_key||String(row.id),
    storageId:String(row.id),
    brandId:row.brand_external_key||row.brand_slug||String(row.brand_id),
    storageBrandId:String(row.brand_id),
    kind:row.kind,
    titleRu:row.title_ru,
    titleEn:row.title_en,
    bodyRu:row.body_ru,
    bodyEn:row.body_en,
    imageUrl:row.image_url,
    ctaLabelRu:row.cta_label_ru,
    ctaLabelEn:row.cta_label_en,
    ctaUrl:row.cta_url,
    eventStartsAt:row.event_starts_at,
    eventEndsAt:row.event_ends_at,
    audienceScope:row.audience_scope||{kind:'brand_followers'},
    placementScope:row.placement_scope||['brand_profile','discover_feed'],
    isPaid:!!row.is_paid,
    sponsorLabelRu:row.sponsor_label_ru,
    sponsorLabelEn:row.sponsor_label_en,
    frequencyCap:row.frequency_cap||{per_user_per_7d:2},
    status:row.status,
    moderationNote:row.moderation_note,
    publishedAt:row.published_at,
    createdAt:row.created_at,
    updatedAt:row.updated_at
  };
}

class Brand365Store{
  constructor({pool,memory}){
    this.pool=pool||null;
    this.memory=memory;
  }
  get persistent(){return !!this.pool;}

  async brandByRef(ref){
    ref=String(ref||'');
    if(!this.pool)return this.memory.brands.find(x=>x.id===ref||x.slug===ref)||null;
    const r=await this.pool.query(`SELECT * FROM brands
      WHERE external_key=$1 OR slug=$1 OR id::text=$1 LIMIT 1`,[ref]);
    return camelBrand(r.rows[0]);
  }

  async channelByRef(ref){
    ref=String(ref||'');
    if(!this.pool)return this.memory.socialChannels.find(x=>x.id===ref)||null;
    const r=await this.pool.query(`SELECT c.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_social_channels c LEFT JOIN brands b ON b.id=c.brand_id
      WHERE c.external_key=$1 OR c.id::text=$1 LIMIT 1`,[ref]);
    return camelChannel(r.rows[0]);
  }

  async channelByProviderId(platform,externalChannelId){
    if(!this.pool)return this.memory.socialChannels.find(x=>x.platform===platform&&String(x.externalChannelId)===String(externalChannelId))||null;
    const r=await this.pool.query(`SELECT c.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_social_channels c LEFT JOIN brands b ON b.id=c.brand_id
      WHERE c.platform=$1 AND c.external_channel_id=$2 LIMIT 1`,[String(platform),String(externalChannelId)]);
    return camelChannel(r.rows[0]);
  }

  async socialConnection(userId,platform){
    if(!this.pool)return this.memory.socialConnections.get(String(userId)+':'+String(platform))||null;
    const r=await this.pool.query(`SELECT * FROM social_connections
      WHERE user_id=$1 AND platform=$2 AND status='active'
      ORDER BY connected_at DESC LIMIT 1`,[userId,platform]);
    if(!r.rowCount)return null;
    const x=r.rows[0];
    return {id:String(x.id),userId:String(x.user_id),platform:x.platform,externalUserId:x.external_user_id,externalHandle:x.external_handle,status:x.status,scopes:x.scopes||[],connectedAt:x.connected_at,lastSyncedAt:x.last_synced_at};
  }

  async socialConnectionByExternalId(platform,externalUserId){
    if(!this.pool)return [...this.memory.socialConnections.values()].find(x=>x.platform===platform&&String(x.externalUserId)===String(externalUserId))||null;
    const r=await this.pool.query(`SELECT * FROM social_connections
      WHERE platform=$1 AND external_user_id=$2 AND status='active'
      ORDER BY connected_at DESC LIMIT 1`,[platform,String(externalUserId)]);
    if(!r.rowCount)return null;
    const x=r.rows[0];
    return {id:String(x.id),userId:String(x.user_id),platform:x.platform,externalUserId:x.external_user_id,externalHandle:x.external_handle,status:x.status,scopes:x.scopes||[],connectedAt:x.connected_at,lastSyncedAt:x.last_synced_at};
  }

  async demoSocialConnect(userId,platform,externalUserId,externalHandle){
    if(!this.pool){
      const item={id:'soc_'+Math.random().toString(16).slice(2),userId:String(userId),platform,externalUserId:String(externalUserId),externalHandle:String(externalHandle||''),status:'active',connectedAt:new Date().toISOString(),demo:true};
      this.memory.socialConnections.set(String(userId)+':'+platform,item);
      return item;
    }
    await this.pool.query(`UPDATE social_connections SET status='revoked'
      WHERE user_id=$1 AND platform=$2 AND status='active'`,[userId,platform]);
    const r=await this.pool.query(`INSERT INTO social_connections(user_id,platform,external_user_id,external_handle,status,scopes,last_synced_at)
      VALUES($1,$2,$3,$4,'active','[]'::jsonb,now())
      ON CONFLICT(user_id,platform,external_user_id)
      DO UPDATE SET external_handle=EXCLUDED.external_handle,status='active',last_synced_at=now()
      RETURNING *`,[userId,platform,String(externalUserId),String(externalHandle||'')]);
    const x=r.rows[0];
    return {id:String(x.id),userId:String(x.user_id),platform:x.platform,externalUserId:x.external_user_id,externalHandle:x.external_handle,status:x.status,connectedAt:x.connected_at,lastSyncedAt:x.last_synced_at};
  }

  async setBrandFollow(userId,brandRef,following){
    if(!this.pool){
      const set=this.memory.brandFollows.get(String(userId))||new Set();
      if(following)set.add(String(brandRef));else set.delete(String(brandRef));
      this.memory.brandFollows.set(String(userId),set);
      return !!following;
    }
    const brand=await this.brandByRef(brandRef);
    if(!brand)throw Object.assign(new Error('brand_not_found'),{code:'brand_not_found'});
    if(following){
      await this.pool.query(`INSERT INTO brand_follows(user_id,brand_id) VALUES($1,$2)
        ON CONFLICT(user_id,brand_id) DO NOTHING`,[userId,brand.storageId]);
    }else{
      await this.pool.query('DELETE FROM brand_follows WHERE user_id=$1 AND brand_id=$2',[userId,brand.storageId]);
    }
    return !!following;
  }

  async brandFollowRefs(userId){
    if(!this.pool)return new Set([...(this.memory.brandFollows.get(String(userId))||new Set())]);
    const r=await this.pool.query(`SELECT COALESCE(b.external_key,b.slug,b.id::text) ref
      FROM brand_follows f JOIN brands b ON b.id=f.brand_id WHERE f.user_id=$1`,[userId]);
    return new Set(r.rows.map(x=>String(x.ref)));
  }

  async isBrandFollow(userId,brandRef){
    const refs=await this.brandFollowRefs(userId);
    return refs.has(String(brandRef));
  }

  async registerInstallation(userId,{installationId,platform}){
    if(!this.pool){
      const item={userId:String(userId),installationId,platform,status:'active',installedAt:new Date().toISOString()};
      this.memory.appInstallations.set(String(userId),item);
      return item;
    }
    const r=await this.pool.query(`INSERT INTO app_installations(user_id,installation_id,platform,status,last_seen_at)
      VALUES($1,$2,$3,'active',now())
      ON CONFLICT(installation_id)
      DO UPDATE SET user_id=EXCLUDED.user_id,platform=EXCLUDED.platform,status='active',last_seen_at=now()
      RETURNING *`,[userId,installationId,platform]);
    const x=r.rows[0];
    return {userId:String(x.user_id),installationId:x.installation_id,platform:x.platform,status:x.status,installedAt:x.installed_at,lastSeenAt:x.last_seen_at};
  }

  async hasActiveInstallation(userId){
    if(!this.pool){
      const x=this.memory.appInstallations.get(String(userId));
      return !!(x&&x.status==='active');
    }
    const r=await this.pool.query(`SELECT 1 FROM app_installations
      WHERE user_id=$1 AND status='active' LIMIT 1`,[userId]);
    return !!r.rowCount;
  }

  async grantBrandAccess(userId,brandRef,role='manager'){
    if(!this.pool){
      const set=this.memory.brandAccess.get(String(userId))||new Set();
      set.add(String(brandRef));this.memory.brandAccess.set(String(userId),set);return true;
    }
    const brand=await this.brandByRef(brandRef);
    if(!brand)return false;
    await this.pool.query(`INSERT INTO brand_access(user_id,brand_id,access_role,status)
      VALUES($1,$2,$3,'active')
      ON CONFLICT(user_id,brand_id) DO UPDATE SET access_role=EXCLUDED.access_role,status='active',updated_at=now()`,[userId,brand.storageId,role]);
    return true;
  }

  async hasBrandAccess(userId,brandRef){
    if(!this.pool){
      const set=this.memory.brandAccess.get(String(userId));
      return !!(set&&set.has(String(brandRef)));
    }
    const brand=await this.brandByRef(brandRef);
    if(!brand)return false;
    const r=await this.pool.query(`SELECT 1 FROM brand_access
      WHERE user_id=$1 AND brand_id=$2 AND status='active' LIMIT 1`,[userId,brand.storageId]);
    return !!r.rowCount;
  }

  async channelsForBrand(brandRef){
    if(!this.pool)return this.memory.socialChannels.filter(x=>x.ownerType==='mfw'||x.brandId===String(brandRef));
    const brand=await this.brandByRef(brandRef);
    if(!brand)return [];
    const r=await this.pool.query(`SELECT c.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_social_channels c LEFT JOIN brands b ON b.id=c.brand_id
      WHERE c.owner_type='mfw' OR c.brand_id=$1
      ORDER BY c.owner_type DESC,c.platform,c.handle`,[brand.storageId]);
    return r.rows.map(camelChannel);
  }

  async membershipsForUser(userId,channels){
    if(!this.pool){
      return channels.map(ch=>({channel:ch,membership:this.memory.socialMemberships.get(String(userId)+':'+String(ch.id))||null}));
    }
    const ids=channels.map(x=>x.storageId).filter(Boolean);
    if(!ids.length)return channels.map(channel=>({channel,membership:null}));
    const r=await this.pool.query(`SELECT m.*,c.external_key channel_external_key,c.platform
      FROM social_memberships m JOIN brand_social_channels c ON c.id=m.channel_id
      WHERE m.user_id=$1 AND m.channel_id=ANY($2::uuid[])`,[userId,ids]);
    const by=new Map(r.rows.map(x=>[String(x.channel_id),camelMembership(x)]));
    return channels.map(channel=>({channel,membership:by.get(String(channel.storageId))||null}));
  }

  async applyMembershipObservation(userId,channel,result,providerEventAt){
    if(!this.pool){
      const key=String(userId)+':'+String(channel.id);
      const prior=this.memory.socialMemberships.get(key)||null;
      const now=new Date().toISOString();
      const active=!!result.active;
      const eventIso=providerEventAt?new Date(providerEventAt).toISOString():null;
      const continuousSince=active?((prior&&prior.status==='active'&&(prior.continuousSince||prior.firstVerifiedAt))||eventIso||now):null;
      const item={id:prior?.id||('sm_'+Math.random().toString(16).slice(2)),userId:String(userId),channelId:channel.id,platform:channel.platform,status:active?'active':'inactive',firstVerifiedAt:prior?.firstVerifiedAt||(active?now:null),providerJoinedAt:eventIso||prior?.providerJoinedAt||null,continuousSince,lastVerifiedAt:now,lastLostAt:active?(prior?.lastLostAt||null):now,proofSource:result.source||channel.verificationMode,providerStatus:result.rawStatus??null,demo:!!result.demo};
      this.memory.socialMemberships.set(key,item);return item;
    }
    const channelStorageId=channel.storageId||String(channel.id);
    const active=!!result.active;
    const eventIso=providerEventAt?new Date(providerEventAt).toISOString():null;
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      const prior=await client.query(`SELECT * FROM social_memberships
        WHERE user_id=$1 AND channel_id=$2 FOR UPDATE`,[userId,channelStorageId]);
      const p=prior.rows[0]||null;
      const firstVerified=p&&p.first_verified_at|| (active?new Date():null);
      const continuous=active?((p&&p.status==='active'&&(p.continuous_since||p.first_verified_at))||eventIso||new Date()):null;
      const providerJoined=eventIso||(p&&p.provider_joined_at)||null;
      const lastLost=active?(p&&p.last_lost_at||null):new Date();
      const r=await client.query(`INSERT INTO social_memberships(
          user_id,channel_id,status,first_verified_at,provider_joined_at,continuous_since,last_verified_at,last_lost_at,proof_source,metadata)
        VALUES($1,$2,$3,$4,$5,$6,now(),$7,$8,$9)
        ON CONFLICT(user_id,channel_id) DO UPDATE SET
          status=EXCLUDED.status,
          first_verified_at=COALESCE(social_memberships.first_verified_at,EXCLUDED.first_verified_at),
          provider_joined_at=COALESCE(EXCLUDED.provider_joined_at,social_memberships.provider_joined_at),
          continuous_since=EXCLUDED.continuous_since,
          last_verified_at=now(),
          last_lost_at=EXCLUDED.last_lost_at,
          proof_source=EXCLUDED.proof_source,
          metadata=EXCLUDED.metadata
        RETURNING *`,[
          userId,channelStorageId,active?'active':'inactive',firstVerified,providerJoined,continuous,lastLost,
          result.source||channel.verificationMode,JSON.stringify({providerStatus:result.rawStatus??null,demo:!!result.demo})
        ]);
      await client.query(`INSERT INTO social_membership_observations(membership_id,is_active,provider_joined_at,source,metadata)
        VALUES($1,$2,$3,$4,$5)`,[r.rows[0].id,active,eventIso,result.source||channel.verificationMode,JSON.stringify({providerStatus:result.rawStatus??null,demo:!!result.demo})]);
      await client.query('COMMIT');
      return camelMembership({...r.rows[0],channel_external_key:channel.id,platform:channel.platform});
    }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
  }

  async activeMembershipCandidates(limit=250){
    if(!this.pool){
      return [...this.memory.socialMemberships.values()].filter(x=>x.status==='active').slice(0,limit).map(m=>({
        membership:m,
        channel:this.memory.socialChannels.find(x=>x.id===m.channelId)||null
      }));
    }
    const r=await this.pool.query(`SELECT m.*,c.external_key channel_external_key,c.owner_type,c.brand_id,c.platform,c.external_channel_id,c.handle,c.url,c.verification_mode,c.status channel_status,b.external_key brand_external_key,b.slug brand_slug
      FROM social_memberships m
      JOIN brand_social_channels c ON c.id=m.channel_id
      LEFT JOIN brands b ON b.id=c.brand_id
      WHERE m.status='active' AND c.status='active'
      ORDER BY m.last_verified_at NULLS FIRST
      LIMIT $1`,[limit]);
    return r.rows.map(x=>({
      membership:camelMembership(x),
      channel:camelChannel({
        id:x.channel_id,external_key:x.channel_external_key,owner_type:x.owner_type,brand_id:x.brand_id,
        platform:x.platform,external_channel_id:x.external_channel_id,handle:x.handle,url:x.url,
        verification_mode:x.verification_mode,status:x.channel_status,brand_external_key:x.brand_external_key,brand_slug:x.brand_slug
      })
    }));
  }

  async beginReverificationRun(triggerSource){
    if(!this.pool)return {id:null,triggerSource,status:'running'};
    const r=await this.pool.query(`INSERT INTO social_reverification_runs(trigger_source,status)
      VALUES($1,'running') RETURNING id,started_at`,[triggerSource]);
    return {id:String(r.rows[0].id),triggerSource,status:'running',startedAt:r.rows[0].started_at};
  }
  async finishReverificationRun(run,result){
    if(!this.pool||!run||!run.id)return;
    const status=result.errors&&result.errors.length?(result.checked?'partial':'failed'):'completed';
    await this.pool.query(`UPDATE social_reverification_runs SET
      status=$2,checked_count=$3,active_count=$4,inactive_count=$5,skipped_count=$6,error_count=$7,summary=$8,completed_at=now()
      WHERE id=$1`,[run.id,status,result.checked||0,result.active||0,result.inactive||0,result.skipped||0,(result.errors||[]).length,JSON.stringify(result)]);
  }

  async offersForBrand(brandRef,{publishedOnly=false}={}){
    if(!this.pool){
      return this.memory.loyaltyOffers.filter(x=>x.brandId===String(brandRef)&&(!publishedOnly||x.status==='published'));
    }
    const brand=await this.brandByRef(brandRef);
    if(!brand)return [];
    const params=[brand.storageId];let filter='';
    if(publishedOnly)filter=" AND o.status='published'";
    const r=await this.pool.query(`SELECT o.*,b.external_key brand_external_key,b.slug brand_slug
      FROM loyalty_offers o JOIN brands b ON b.id=o.brand_id
      WHERE o.brand_id=$1${filter} ORDER BY o.created_at DESC`,params);
    const ids=r.rows.map(x=>String(x.id));
    let reqs=[];
    if(ids.length){
      const q=await this.pool.query(`SELECT r.*,c.external_key channel_external_key
        FROM loyalty_offer_requirements r LEFT JOIN brand_social_channels c ON c.id=r.channel_id
        WHERE r.offer_id=ANY($1::uuid[]) ORDER BY r.sort_order,r.id`,[ids]);
      reqs=q.rows;
    }
    return r.rows.map(row=>camelOffer(row,reqs.filter(x=>String(x.offer_id)===String(row.id))));
  }

  async offerByRef(ref){
    if(!this.pool)return this.memory.loyaltyOffers.find(x=>x.id===String(ref))||null;
    const r=await this.pool.query(`SELECT o.*,b.external_key brand_external_key,b.slug brand_slug
      FROM loyalty_offers o JOIN brands b ON b.id=o.brand_id
      WHERE o.external_key=$1 OR o.id::text=$1 LIMIT 1`,[String(ref)]);
    if(!r.rowCount)return null;
    const req=await this.pool.query(`SELECT r.*,c.external_key channel_external_key
      FROM loyalty_offer_requirements r LEFT JOIN brand_social_channels c ON c.id=r.channel_id
      WHERE r.offer_id=$1 ORDER BY r.sort_order,r.id`,[r.rows[0].id]);
    return camelOffer(r.rows[0],req.rows);
  }

  async evaluateOffer(userId,offer){
    if(!this.pool)return null;
    const user=await this.pool.query('SELECT 1 FROM users WHERE id=$1 AND status=\'active\' LIMIT 1',[userId]);
    const install=await this.hasActiveInstallation(userId);
    const followed=await this.brandFollowRefs(userId);
    const progress=[];
    for(const req of offer.requirements||[]){
      let ok=false,currentDays=0,detail='';
      if(req.type==='registered_user'){ok=!!user.rowCount;detail=ok?'registered':'mfw_id_required';}
      else if(req.type==='app_installed'){ok=install;detail=ok?'active_installation':'install_required';}
      else if(req.type==='brand_follow_in_mfw'){ok=followed.has(String(offer.brandId));detail=ok?'following_in_mfw':'follow_brand_in_mfw';}
      else if(req.type==='mfw_social_follow'||req.type==='brand_social_follow'){
        const ch=await this.channelByRef(req.channelId);
        if(ch){
          const r=await this.pool.query(`SELECT status,continuous_since FROM social_memberships
            WHERE user_id=$1 AND channel_id=$2 LIMIT 1`,[userId,ch.storageId]);
          if(r.rowCount){
            const m=r.rows[0];
            currentDays=m.status==='active'&&m.continuous_since?Math.max(0,Math.floor((Date.now()-new Date(m.continuous_since).getTime())/86400000)):0;
            ok=m.status==='active'&&currentDays>=Number(req.minContinuousDays||0);
            detail=m.status;
          }else detail='verification_required';
        }else detail='channel_missing';
      }
      progress.push({...req,ok,currentDays,detail});
    }
    const eligible=progress.filter(x=>x.required!==false).every(x=>x.ok);
    const status=eligible?'eligible':'progress';
    await this.pool.query(`INSERT INTO loyalty_eligibility(user_id,offer_id,status,progress,qualified_at,last_evaluated_at)
      VALUES($1,$2,$3,$4,$5,now())
      ON CONFLICT(user_id,offer_id) DO UPDATE SET
        status=EXCLUDED.status,progress=EXCLUDED.progress,
        qualified_at=CASE WHEN EXCLUDED.status='eligible' THEN COALESCE(loyalty_eligibility.qualified_at,now()) ELSE loyalty_eligibility.qualified_at END,
        last_evaluated_at=now()`,[userId,offer.storageId,status,JSON.stringify(progress),eligible?new Date():null]);
    return {offerId:offer.id,userId:String(userId),status,eligible,progress,evaluatedAt:new Date().toISOString()};
  }

  async createClaim(userId,offer,tokenHash,expiresAt){
    if(!this.pool)return null;
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      const existing=await client.query(`SELECT * FROM loyalty_claims
        WHERE user_id=$1 AND offer_id=$2 AND status IN ('issued','redeemed')
        ORDER BY issued_at DESC LIMIT 1 FOR UPDATE`,[userId,offer.storageId]);
      if(existing.rowCount){await client.query('COMMIT');return {existing:true,claim:existing.rows[0]};}
      if(offer.stockLimit!=null){
        const stock=await client.query(`SELECT count(*)::int n FROM loyalty_claims
          WHERE offer_id=$1 AND status IN ('issued','redeemed')`,[offer.storageId]);
        if(Number(stock.rows[0].n)>=Number(offer.stockLimit)){await client.query('ROLLBACK');return {stockExhausted:true};}
      }
      const r=await client.query(`INSERT INTO loyalty_claims(user_id,offer_id,claim_token_hash,status,expires_at,metadata)
        VALUES($1,$2,$3,'issued',$4,'{}'::jsonb) RETURNING *`,[userId,offer.storageId,tokenHash,expiresAt]);
      await client.query('COMMIT');return {existing:false,claim:r.rows[0]};
    }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
  }

  async claimByHash(hash){
    if(!this.pool)return null;
    const r=await this.pool.query(`SELECT c.*,o.external_key offer_external_key,o.brand_id,b.external_key brand_external_key,b.slug brand_slug,
      o.reward_type,o.reward_value,o.status offer_status
      FROM loyalty_claims c JOIN loyalty_offers o ON o.id=c.offer_id JOIN brands b ON b.id=o.brand_id
      WHERE c.claim_token_hash=$1 LIMIT 1`,[hash]);
    return r.rows[0]||null;
  }
  async updateClaimStatus(claimId,status,redeemedBy){
    if(!this.pool)return null;
    const r=await this.pool.query(`UPDATE loyalty_claims SET status=$2,
      redeemed_at=CASE WHEN $2='redeemed' THEN now() ELSE redeemed_at END,
      redeemed_by=CASE WHEN $2='redeemed' THEN $3 ELSE redeemed_by END
      WHERE id=$1 RETURNING *`,[claimId,status,redeemedBy||null]);
    return r.rows[0]||null;
  }
  async revokeIssuedClaimsIfIneligible(userId){
    if(!this.pool)return 0;
    const r=await this.pool.query(`SELECT c.id,o.external_key offer_ref
      FROM loyalty_claims c JOIN loyalty_offers o ON o.id=c.offer_id
      WHERE c.user_id=$1 AND c.status='issued'`,[userId]);
    let n=0;
    for(const row of r.rows){
      const offer=await this.offerByRef(row.offer_ref);
      const ev=await this.evaluateOffer(userId,offer);
      if(!ev.eligible){await this.updateClaimStatus(row.id,'revoked');n++;}
    }
    return n;
  }

  async postsForBrand(brandRef,{publishedOnly=true}={}){
    if(!this.pool)return this.memory.brandPosts.filter(x=>x.brandId===String(brandRef)&&(!publishedOnly||x.status==='published')).sort((a,b)=>String(b.publishedAt||b.createdAt||'').localeCompare(String(a.publishedAt||a.createdAt||'')));
    const brand=await this.brandByRef(brandRef);if(!brand)return [];
    const r=await this.pool.query(`SELECT p.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_content_posts p JOIN brands b ON b.id=p.brand_id
      WHERE p.brand_id=$1 ${publishedOnly?"AND p.status='published'":''}
      ORDER BY COALESCE(p.published_at,p.created_at) DESC`,[brand.storageId]);
    return r.rows.map(camelPost);
  }

  async createPost(brandRef,b){
    if(!this.pool)return null;
    const brand=await this.brandByRef(brandRef);if(!brand)return null;
    const paid=!!b.isPaid||((b.audienceScope&&b.audienceScope.kind)==='all_mfw');
    const externalKey='bp_'+Date.now().toString(36)+'_'+Math.random().toString(16).slice(2,8);
    const r=await this.pool.query(`INSERT INTO brand_content_posts(
      brand_id,external_key,kind,title_ru,title_en,body_ru,body_en,image_url,cta_label_ru,cta_label_en,cta_url,
      event_starts_at,event_ends_at,audience_scope,placement_scope,is_paid,sponsor_label_ru,sponsor_label_en,status,published_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,[
        brand.storageId,externalKey,String(b.kind||'news'),String(b.titleRu||'Новости бренда'),String(b.titleEn||'Brand news'),
        String(b.bodyRu||''),String(b.bodyEn||''),String(b.imageUrl||''),String(b.ctaLabelRu||'Открыть'),String(b.ctaLabelEn||'Open'),String(b.ctaUrl||'#'),
        b.eventStartsAt||null,b.eventEndsAt||null,b.audienceScope||{kind:'brand_followers'},b.placementScope||['brand_profile','discover_feed'],paid,
        paid?'Реклама бренда':null,paid?'Brand promotion':null,paid?'pending_review':'published',paid?null:new Date()
      ]);
    return camelPost({...r.rows[0],brand_external_key:brand.id,brand_slug:brand.slug});
  }

  async createOffer(brandRef,b){
    if(!this.pool)return null;
    const brand=await this.brandByRef(brandRef);if(!brand)return null;
    const externalKey='lo_'+Date.now().toString(36)+'_'+Math.random().toString(16).slice(2,8);
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(`INSERT INTO loyalty_offers(
        brand_id,external_key,title_ru,title_en,description_ru,description_en,reward_type,reward_value,min_continuous_days,status,stock_limit,per_user_limit,terms_ru,terms_en)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11,$12,$13) RETURNING *`,[
          brand.storageId,externalKey,String(b.titleRu||'Новая привилегия'),String(b.titleEn||'New reward'),
          String(b.descriptionRu||''),String(b.descriptionEn||''),String(b.rewardType||'discount_percent'),
          b.rewardValue==null?null:Number(b.rewardValue),Math.max(0,Number(b.minContinuousDays||30)),
          b.stockLimit==null?null:Number(b.stockLimit),Math.max(1,Number(b.perUserLimit||1)),String(b.termsRu||''),String(b.termsEn||'')
        ]);
      let order=10;
      for(const req of Array.isArray(b.requirements)?b.requirements:[]){
        let channelId=null;
        if(req.channelId){
          const ch=await this.channelByRef(req.channelId);channelId=ch&&ch.storageId||null;
        }
        await client.query(`INSERT INTO loyalty_offer_requirements(offer_id,requirement_type,channel_id,min_continuous_days,required,sort_order,metadata)
          VALUES($1,$2,$3,$4,$5,$6,$7)`,[r.rows[0].id,String(req.type),channelId,Math.max(0,Number(req.minContinuousDays||0)),req.required!==false,order,req.metadata||{}]);
        order+=10;
      }
      await client.query('COMMIT');
      return this.offerByRef(externalKey);
    }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
  }

  async addSocialChannel(brandRef,b){
    if(!this.pool)return null;
    const brand=await this.brandByRef(brandRef);if(!brand)return null;
    const platform=String(b.platform||'').toLowerCase();
    const verificationMode=platform==='telegram'?'membership_event':platform==='vk'?'api_current':'unsupported';
    const externalKey='sc_'+Date.now().toString(36)+'_'+Math.random().toString(16).slice(2,8);
    const r=await this.pool.query(`INSERT INTO brand_social_channels(
      brand_id,owner_type,platform,external_channel_id,handle,url,verification_mode,status,external_key,metadata)
      VALUES($1,'brand',$2,$3,$4,$5,$6,$7,$8,'{}'::jsonb)
      ON CONFLICT(platform,external_channel_id) DO UPDATE SET
        brand_id=EXCLUDED.brand_id,handle=EXCLUDED.handle,url=EXCLUDED.url,verification_mode=EXCLUDED.verification_mode,status=EXCLUDED.status
      RETURNING *`,[brand.storageId,platform,String(b.externalChannelId||''),String(b.handle||''),String(b.url||''),verificationMode,platform==='instagram'?'paused':'active',externalKey]);
    return camelChannel({...r.rows[0],brand_external_key:brand.id,brand_slug:brand.slug});
  }

  async preferences(userId){
    if(!this.pool){
      const key=String(userId);
      if(!this.memory.notificationPreferences.has(key))this.memory.notificationPreferences.set(key,{userId:key,criticalEnabled:true,liveEnabled:true,followedBrandNewsEnabled:true,loyaltyEnabled:true,brandEventsEnabled:true,paidPromotionsEnabled:false,quietHours:{},updatedAt:new Date().toISOString()});
      return this.memory.notificationPreferences.get(key);
    }
    await this.pool.query(`INSERT INTO notification_preferences(user_id) VALUES($1)
      ON CONFLICT(user_id) DO NOTHING`,[userId]);
    const r=await this.pool.query('SELECT * FROM notification_preferences WHERE user_id=$1',[userId]);
    const x=r.rows[0];
    return {userId:String(x.user_id),criticalEnabled:x.critical_enabled,liveEnabled:x.live_enabled,followedBrandNewsEnabled:x.followed_brand_news_enabled,loyaltyEnabled:x.loyalty_enabled,brandEventsEnabled:x.brand_events_enabled,paidPromotionsEnabled:x.paid_promotions_enabled,quietHours:x.quiet_hours||{},updatedAt:x.updated_at};
  }

  async updatePreferences(userId,b){
    if(!this.pool){
      const p=await this.preferences(userId);
      for(const k of ['criticalEnabled','liveEnabled','followedBrandNewsEnabled','loyaltyEnabled','brandEventsEnabled','paidPromotionsEnabled'])if(Object.prototype.hasOwnProperty.call(b,k))p[k]=!!b[k];
      if(b.quietHours&&typeof b.quietHours==='object')p.quietHours=b.quietHours;p.updatedAt=new Date().toISOString();return p;
    }
    const current=await this.preferences(userId);
    const next={...current};
    for(const k of ['criticalEnabled','liveEnabled','followedBrandNewsEnabled','loyaltyEnabled','brandEventsEnabled','paidPromotionsEnabled'])if(Object.prototype.hasOwnProperty.call(b,k))next[k]=!!b[k];
    if(b.quietHours&&typeof b.quietHours==='object')next.quietHours=b.quietHours;
    await this.pool.query(`UPDATE notification_preferences SET
      critical_enabled=$2,live_enabled=$3,followed_brand_news_enabled=$4,loyalty_enabled=$5,brand_events_enabled=$6,paid_promotions_enabled=$7,quiet_hours=$8,updated_at=now()
      WHERE user_id=$1`,[userId,next.criticalEnabled,next.liveEnabled,next.followedBrandNewsEnabled,next.loyaltyEnabled,next.brandEventsEnabled,next.paidPromotionsEnabled,next.quietHours]);
    return this.preferences(userId);
  }

  async recordImpression(userId,postRef,surface){
    if(!this.pool)return false;
    const r=await this.pool.query(`SELECT id FROM brand_content_posts WHERE external_key=$1 OR id::text=$1 LIMIT 1`,[String(postRef)]);
    if(!r.rowCount)return false;
    await this.pool.query(`INSERT INTO content_impressions(user_id,post_id,surface) VALUES($1,$2,$3)`,[/^[0-9a-f-]{36}$/i.test(String(userId))?userId:null,r.rows[0].id,String(surface||'mfw_365')]);
    return true;
  }

  async personalFeed(userId){
    if(!this.pool)return null;
    const followed=await this.brandFollowRefs(userId);
    const postsR=await this.pool.query(`SELECT p.*,b.external_key brand_external_key,b.slug brand_slug,
      COALESCE(i.impressions_7d,0)::int impressions_7d
      FROM brand_content_posts p
      JOIN brands b ON b.id=p.brand_id
      LEFT JOIN LATERAL (
        SELECT count(*) impressions_7d FROM content_impressions ci
        WHERE ci.post_id=p.id AND ci.user_id=$1 AND ci.occurred_at>=now()-interval '7 days'
      ) i ON true
      WHERE p.status='published'
      ORDER BY COALESCE(p.published_at,p.created_at) DESC`,[userId]);
    const now=Date.now();
    const eligible=[];
    for(const row of postsR.rows){
      const post=camelPost(row);
      const audience=post.audienceScope&&post.audienceScope.kind;
      if(audience==='brand_followers'&&!followed.has(String(post.brandId)))continue;
      if(!['all_mfw','brand_followers'].includes(audience))continue;
      const cap=Number(post.frequencyCap&&post.frequencyCap.per_user_per_7d||post.frequencyCap&&post.frequencyCap.perUserPer7d||2);
      if(post.isPaid&&Number(row.impressions_7d)>=cap)continue;
      const ageHours=Math.max(0,(now-new Date(post.publishedAt||post.createdAt||now).getTime())/3600000);
      const freshness=Math.max(0,30-Math.min(30,ageHours/24));
      let score=60,reason='mfw_relevant';
      if(post.kind==='event'&&followed.has(String(post.brandId))&&!post.isPaid){score=108;reason='followed_brand_event';}
      else if(post.kind==='offer'&&followed.has(String(post.brandId))&&!post.isPaid){score=105;reason='followed_brand_offer';}
      else if(followed.has(String(post.brandId))&&!post.isPaid){score=100;reason='followed_brand';}
      else if(post.isPaid){score=35;reason='sponsored';}
      eligible.push({...post,feedScore:Math.round((score+freshness)*100)/100,feedReason:reason});
    }
    eligible.sort((a,b)=>b.feedScore-a.feedScore||String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));
    const result=[];let sincePaid=4;
    for(const post of eligible){if(post.isPaid){if(sincePaid<3)continue;sincePaid=0;}else sincePaid++;result.push(post);}
    return result;
  }


  async createAuthFlow({userId,platform,state,codeVerifier,nonce,redirectUri,metadata}){
    if(!this.pool){
      if(!this.memory.socialAuthFlows)this.memory.socialAuthFlows=new Map();
      const item={id:'saf_'+Math.random().toString(16).slice(2),userId:String(userId),platform,state,codeVerifier,nonce:nonce||null,redirectUri,status:'pending',metadata:metadata||{},createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+10*60000).toISOString()};
      this.memory.socialAuthFlows.set(state,item);return item;
    }
    const r=await this.pool.query(`INSERT INTO social_auth_flows(user_id,platform,state,code_verifier,nonce,redirect_uri,status,metadata)
      VALUES($1,$2,$3,$4,$5,$6,'pending',$7) RETURNING *`,[userId,platform,state,codeVerifier,nonce||null,redirectUri,metadata||{}]);
    const x=r.rows[0];
    return {id:String(x.id),userId:String(x.user_id),platform:x.platform,state:x.state,codeVerifier:x.code_verifier,nonce:x.nonce,redirectUri:x.redirect_uri,status:x.status,metadata:x.metadata||{},createdAt:x.created_at,expiresAt:x.expires_at};
  }

  async authFlowByState(platform,state){
    if(!this.pool){
      const x=this.memory.socialAuthFlows&&this.memory.socialAuthFlows.get(String(state));
      if(!x||x.platform!==platform||x.status!=='pending')return null;
      if(Date.now()>=new Date(x.expiresAt).getTime()){x.status='expired';return null;}
      return x;
    }
    await this.pool.query(`UPDATE social_auth_flows SET status='expired'
      WHERE status='pending' AND expires_at<=now()`);
    const r=await this.pool.query(`SELECT * FROM social_auth_flows
      WHERE platform=$1 AND state=$2 AND status='pending' AND expires_at>now()
      LIMIT 1`,[platform,String(state)]);
    if(!r.rowCount)return null;
    const x=r.rows[0];
    return {id:String(x.id),userId:String(x.user_id),platform:x.platform,state:x.state,codeVerifier:x.code_verifier,nonce:x.nonce,redirectUri:x.redirect_uri,status:x.status,metadata:x.metadata||{},createdAt:x.created_at,expiresAt:x.expires_at};
  }

  async finishAuthFlow(flow,status,metadata){
    if(!flow)return;
    if(!this.pool){
      flow.status=status;flow.completedAt=new Date().toISOString();flow.metadata={...(flow.metadata||{}),...(metadata||{})};return;
    }
    await this.pool.query(`UPDATE social_auth_flows SET status=$2,metadata=metadata||$3::jsonb,completed_at=now()
      WHERE id=$1`,[flow.id,status,JSON.stringify(metadata||{})]);
  }

  async upsertSocialConnection(userId,platform,externalUserId,externalHandle,scopes,metadata){
    if(!this.pool){
      const key=String(userId)+':'+String(platform);
      const item={id:'soc_'+Math.random().toString(16).slice(2),userId:String(userId),platform,externalUserId:String(externalUserId),externalHandle:String(externalHandle||''),status:'active',scopes:scopes||[],connectedAt:new Date().toISOString(),lastSyncedAt:new Date().toISOString(),metadata:metadata||{}};
      this.memory.socialConnections.set(key,item);return item;
    }
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      await client.query(`UPDATE social_connections SET status='revoked',last_synced_at=now()
        WHERE user_id=$1 AND platform=$2 AND status='active' AND external_user_id<>$3`,[userId,platform,String(externalUserId)]);
      const r=await client.query(`INSERT INTO social_connections(user_id,platform,external_user_id,external_handle,status,scopes,last_synced_at)
        VALUES($1,$2,$3,$4,'active',$5,now())
        ON CONFLICT(user_id,platform,external_user_id)
        DO UPDATE SET external_handle=EXCLUDED.external_handle,status='active',scopes=EXCLUDED.scopes,last_synced_at=now()
        RETURNING *`,[userId,platform,String(externalUserId),String(externalHandle||''),scopes||[]]);
      await client.query('COMMIT');
      const x=r.rows[0];
      return {id:String(x.id),userId:String(x.user_id),platform:x.platform,externalUserId:x.external_user_id,externalHandle:x.external_handle,status:x.status,scopes:x.scopes||[],connectedAt:x.connected_at,lastSyncedAt:x.last_synced_at,metadata:metadata||{}};
    }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
  }

  async followerCount(brandRef){
    if(!this.pool){
      return [...this.memory.brandFollows.values()].reduce((n,set)=>n+(set.has(String(brandRef))?1:0),0);
    }
    const brand=await this.brandByRef(brandRef);if(!brand)return 0;
    const r=await this.pool.query('SELECT count(*)::int n FROM brand_follows WHERE brand_id=$1',[brand.storageId]);
    return Number(r.rows[0].n||0);
  }

  async claimsForBrand(brandRef){
    if(!this.pool){
      const offerIds=new Set(this.memory.loyaltyOffers.filter(x=>x.brandId===String(brandRef)).map(x=>x.id));
      return [...this.memory.loyaltyClaims.values()].filter(x=>offerIds.has(x.offerId));
    }
    const brand=await this.brandByRef(brandRef);if(!brand)return [];
    const r=await this.pool.query(`SELECT c.*,o.external_key offer_external_key,o.reward_type,o.reward_value
      FROM loyalty_claims c JOIN loyalty_offers o ON o.id=c.offer_id
      WHERE o.brand_id=$1 ORDER BY c.issued_at DESC`,[brand.storageId]);
    return r.rows.map(x=>({id:String(x.id),userId:String(x.user_id),offerId:x.offer_external_key||String(x.offer_id),status:x.status,issuedAt:x.issued_at,expiresAt:x.expires_at,redeemedAt:x.redeemed_at,rewardType:x.reward_type,rewardValue:x.reward_value==null?null:Number(x.reward_value)}));
  }

  async moderatePost(postRef,status,note){
    if(!this.pool){
      const p=this.memory.brandPosts.find(x=>x.id===String(postRef));if(!p)return null;
      p.status=status||p.status;if(p.status==='published'&&!p.publishedAt)p.publishedAt=new Date().toISOString();
      p.moderationNote=String(note||p.moderationNote||'');return p;
    }
    const r=await this.pool.query(`UPDATE brand_content_posts SET
      status=COALESCE($2,status),
      moderation_note=COALESCE(NULLIF($3,''),moderation_note),
      published_at=CASE WHEN COALESCE($2,status)='published' THEN COALESCE(published_at,now()) ELSE published_at END,
      updated_at=now()
      WHERE external_key=$1 OR id::text=$1
      RETURNING *`,[String(postRef),status||null,String(note||'')]);
    if(!r.rowCount)return null;
    const b=await this.pool.query('SELECT external_key,slug FROM brands WHERE id=$1',[r.rows[0].brand_id]);
    return camelPost({...r.rows[0],brand_external_key:b.rows[0]&&b.rows[0].external_key,brand_slug:b.rows[0]&&b.rows[0].slug});
  }

  async moderateOffer(offerRef,status){
    if(!this.pool){
      const o=this.memory.loyaltyOffers.find(x=>x.id===String(offerRef));if(!o)return null;o.status=status||o.status;return o;
    }
    const r=await this.pool.query(`UPDATE loyalty_offers SET status=COALESCE($2,status),updated_at=now()
      WHERE external_key=$1 OR id::text=$1 RETURNING external_key,id`,[String(offerRef),status||null]);
    if(!r.rowCount)return null;
    return this.offerByRef(r.rows[0].external_key||String(r.rows[0].id));
  }

  async brandPushCount(brandRef,days=7){
    if(!this.pool){
      const cutoff=Date.now()-Number(days)*86400000;
      return this.memory.notifications.filter(n=>n.category==='brand_news'&&n.brandId===String(brandRef)&&['scheduled','sent'].includes(n.status)&&new Date(n.createdAt||n.sentAt||0).getTime()>=cutoff).length;
    }
    const r=await this.pool.query(`SELECT count(*)::int n FROM notifications
      WHERE category='brand_news'
        AND COALESCE(payload->>'brandRef','')=$1
        AND status IN ('scheduled','sending','sent')
        AND created_at>=now()-($2::text||' days')::interval`,[String(brandRef),String(Number(days))]);
    return Number(r.rows[0].n||0);
  }

  async createBrandPush(brandRef,postRef){
    if(!this.pool)return null;
    const brand=await this.brandByRef(brandRef);if(!brand)return null;
    const p=await this.pool.query(`SELECT * FROM brand_content_posts
      WHERE brand_id=$1 AND (external_key=$2 OR id::text=$2) LIMIT 1`,[brand.storageId,String(postRef)]);
    if(!p.rowCount)return {error:'post_not_found'};
    const post=camelPost({...p.rows[0],brand_external_key:brand.id,brand_slug:brand.slug});
    if(post.status!=='published')return {error:'post_not_published'};
    if(post.isPaid||(post.audienceScope&&post.audienceScope.kind)!=='brand_followers')return {error:'mfw_wide_push_requires_organizer'};
    const count=await this.brandPushCount(brandRef,7);
    if(count>=2)return {error:'brand_push_frequency_cap',limit:2,windowDays:7};
    const r=await this.pool.query(`INSERT INTO notifications(audience,category,title,body,payload,status,scheduled_at)
      VALUES($1,'brand_news',$2,$3,$4,'scheduled',now()) RETURNING *`,[
        {kind:'brand_followers',brandRef:String(brandRef)},post.titleRu,post.bodyRu||'',
        {brandRef:String(brandRef),postRef:String(postRef)}
      ]);
    const x=r.rows[0];
    return {data:{id:String(x.id),category:x.category,brandId:String(brandRef),postId:String(postRef),audience:x.audience,title:x.title,body:x.body,status:x.status,createdAt:x.created_at,scheduledAt:x.scheduled_at},policy:{frequencyCap:'2_per_brand_per_7d',audience:'brand_followers_only'}};
  }

  async notificationsForUser(userId){
    if(!this.pool)return null;
    const pref=await this.preferences(userId);
    const followed=await this.brandFollowRefs(userId);
    const r=await this.pool.query(`SELECT * FROM notifications
      WHERE status IN ('scheduled','sending','sent')
      ORDER BY COALESCE(sent_at,scheduled_at,created_at) DESC LIMIT 60`);
    const data=[];
    for(const n of r.rows){
      const payload=n.payload||{},aud=n.audience||{};
      const brandRef=payload.brandRef||aud.brandRef||null;
      let include=false;
      if(n.category==='critical')include=!!pref.criticalEnabled;
      else if(n.category==='live')include=!!pref.liveEnabled;
      else if(n.category==='brand_news')include=!!pref.followedBrandNewsEnabled&&brandRef&&followed.has(String(brandRef));
      else if(n.category==='loyalty')include=!!pref.loyaltyEnabled;
      else if(n.category==='brand_event')include=!!pref.brandEventsEnabled&&brandRef&&followed.has(String(brandRef));
      else if(n.category==='brand_campaign')include=!!pref.paidPromotionsEnabled;
      if(include)data.push({id:String(n.id),category:n.category,title:n.title,body:n.body,status:n.status,brandId:brandRef,postId:payload.postRef||null,createdAt:n.created_at,scheduledAt:n.scheduled_at,sentAt:n.sent_at});
      if(data.length>=30)break;
    }
    return {data,preferences:pref};
  }

  async brandGrowth(){
    if(!this.pool)return null;
    const brandsR=await this.pool.query(`SELECT b.id,b.external_key,b.slug,b.name,
      (SELECT count(*) FROM brand_follows f WHERE f.brand_id=b.id)::int followers,
      (SELECT count(*) FROM brand_content_posts p WHERE p.brand_id=b.id AND p.status='published')::int published_posts,
      (SELECT count(*) FROM loyalty_offers o WHERE o.brand_id=b.id AND o.status='published')::int active_offers,
      (SELECT count(*) FROM loyalty_claims c JOIN loyalty_offers o ON o.id=c.offer_id WHERE o.brand_id=b.id)::int issued_claims
      FROM brands b WHERE b.status='published' ORDER BY b.name`);
    const channelsR=await this.pool.query(`SELECT c.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_social_channels c LEFT JOIN brands b ON b.id=c.brand_id ORDER BY c.owner_type,c.platform`);
    const membersR=await this.pool.query(`SELECT count(*)::int total,
      count(*) FILTER(WHERE status='active')::int active FROM social_memberships`);
    const offers=[];
    for(const b of brandsR.rows){
      const ref=b.external_key||b.slug||String(b.id);
      offers.push(...await this.offersForBrand(ref));
    }
    const postsR=await this.pool.query(`SELECT p.*,b.external_key brand_external_key,b.slug brand_slug
      FROM brand_content_posts p JOIN brands b ON b.id=p.brand_id ORDER BY COALESCE(p.published_at,p.created_at) DESC LIMIT 100`);
    return {
      brands:brandsR.rows.map(x=>({id:x.external_key||x.slug||String(x.id),name:x.name,followers:Number(x.followers||0),publishedPosts:Number(x.published_posts||0),activeOffers:Number(x.active_offers||0),issuedClaims:Number(x.issued_claims||0)})),
      social:{channels:channelsR.rows.map(camelChannel),membershipsVerified:Number(membersR.rows[0].total||0),activeMemberships:Number(membersR.rows[0].active||0)},
      offers,
      content:{posts:postsR.rows.map(camelPost),recentInteractions:[]}
    };
  }

  async retentionMetrics(){
    if(!this.pool)return null;
    const feed=await this.pool.query(`SELECT
      count(*)::int impressions,
      count(*) FILTER(WHERE p.is_paid=false)::int organic,
      count(*) FILTER(WHERE p.is_paid=true)::int paid
      FROM content_impressions i JOIN brand_content_posts p ON p.id=i.post_id`);
    const opens=await this.pool.query(`SELECT count(*)::int n FROM analytics_events WHERE event_name='brand_content_open'`);
    const push=await this.pool.query(`SELECT
      count(*) FILTER(WHERE status='scheduled')::int scheduled,
      count(*) FILTER(WHERE status='sent')::int sent,
      count(*) FILTER(WHERE category='brand_news' AND created_at>=now()-interval '7 days')::int brand7
      FROM notifications`);
    const impressions=Number(feed.rows[0].impressions||0),openN=Number(opens.rows[0].n||0);
    return {
      feed:{impressions,organicImpressions:Number(feed.rows[0].organic||0),paidImpressions:Number(feed.rows[0].paid||0),opens:openN,openRatePct:impressions?Math.round(openN/impressions*1000)/10:0},
      push:{scheduled:Number(push.rows[0].scheduled||0),sent:Number(push.rows[0].sent||0),brandNewsLast7d:Number(push.rows[0].brand7||0)},
      policy:{organicPriority:true,paidLabelRequired:true,paidFeedFrequencyCap:'2_per_post_per_7d',paidFeedSpacing:'max_1_per_4_slots',brandPushFrequencyCap:'2_per_brand_per_7d',paidPushByBrand:false}
    };
  }

  async seedDemo(){
    if(!this.pool)return;
    for(const b of this.memory.brands){
      await this.pool.query(`UPDATE brands SET external_key=$2,description=COALESCE(description,$3),metadata=metadata||$4::jsonb
        WHERE slug=$1`,[b.slug,b.id,b.description||null,JSON.stringify({segment:b.segment,demo:true})]);
    }
    for(const c of this.memory.socialChannels){
      const brand=c.brandId?await this.brandByRef(c.brandId):null;
      await this.pool.query(`INSERT INTO brand_social_channels(
        brand_id,owner_type,platform,external_channel_id,handle,url,verification_mode,status,external_key,verified_at,metadata)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT(platform,external_channel_id) DO UPDATE SET
          brand_id=EXCLUDED.brand_id,owner_type=EXCLUDED.owner_type,handle=EXCLUDED.handle,url=EXCLUDED.url,
          verification_mode=EXCLUDED.verification_mode,status=EXCLUDED.status,external_key=EXCLUDED.external_key
        `,[brand&&brand.storageId||null,c.ownerType,c.platform,c.externalChannelId,c.handle||null,c.url||null,c.verificationMode,c.status,c.id,c.verifiedAt||null,JSON.stringify({demo:true})]);
    }
    for(const o of this.memory.loyaltyOffers){
      const brand=await this.brandByRef(o.brandId);if(!brand)continue;
      const r=await this.pool.query(`INSERT INTO loyalty_offers(
        brand_id,external_key,title_ru,title_en,description_ru,description_en,reward_type,reward_value,min_continuous_days,stock_limit,per_user_limit,status,terms_ru,terms_en,audience_scope)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT(external_key) DO UPDATE SET
          title_ru=EXCLUDED.title_ru,title_en=EXCLUDED.title_en,description_ru=EXCLUDED.description_ru,description_en=EXCLUDED.description_en,
          reward_type=EXCLUDED.reward_type,reward_value=EXCLUDED.reward_value,min_continuous_days=EXCLUDED.min_continuous_days,
          stock_limit=EXCLUDED.stock_limit,per_user_limit=EXCLUDED.per_user_limit,status=EXCLUDED.status,terms_ru=EXCLUDED.terms_ru,terms_en=EXCLUDED.terms_en
        RETURNING id`,[brand.storageId,o.id,o.titleRu,o.titleEn,o.descriptionRu||null,o.descriptionEn||null,o.rewardType,o.rewardValue,o.minContinuousDays,o.stockLimit,o.perUserLimit,o.status,o.termsRu||null,o.termsEn||null,o.audienceScope||{kind:'all_mfw'}]);
      await this.pool.query('DELETE FROM loyalty_offer_requirements WHERE offer_id=$1',[r.rows[0].id]);
      let order=10;
      for(const req of o.requirements||[]){
        const ch=req.channelId?await this.channelByRef(req.channelId):null;
        await this.pool.query(`INSERT INTO loyalty_offer_requirements(offer_id,requirement_type,channel_id,min_continuous_days,required,sort_order,metadata)
          VALUES($1,$2,$3,$4,$5,$6,$7)`,[r.rows[0].id,req.type,ch&&ch.storageId||null,req.minContinuousDays||0,req.required!==false,order,req.metadata||{}]);
        order+=10;
      }
    }
    for(const p of this.memory.brandPosts){
      const brand=await this.brandByRef(p.brandId);if(!brand)continue;
      await this.pool.query(`INSERT INTO brand_content_posts(
        brand_id,external_key,kind,title_ru,title_en,body_ru,body_en,image_url,cta_label_ru,cta_label_en,cta_url,event_starts_at,event_ends_at,
        audience_scope,placement_scope,is_paid,sponsor_label_ru,sponsor_label_en,frequency_cap,status,moderation_note,published_at,created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,COALESCE($23,now()))
        ON CONFLICT(external_key) DO UPDATE SET
          title_ru=EXCLUDED.title_ru,title_en=EXCLUDED.title_en,body_ru=EXCLUDED.body_ru,body_en=EXCLUDED.body_en,image_url=EXCLUDED.image_url,
          audience_scope=EXCLUDED.audience_scope,placement_scope=EXCLUDED.placement_scope,is_paid=EXCLUDED.is_paid,status=EXCLUDED.status,published_at=EXCLUDED.published_at
        `,[brand.storageId,p.id,p.kind,p.titleRu,p.titleEn,p.bodyRu||null,p.bodyEn||null,p.imageUrl||null,p.ctaLabelRu||null,p.ctaLabelEn||null,p.ctaUrl||null,p.eventStartsAt||null,p.eventEndsAt||null,p.audienceScope||{kind:'brand_followers'},p.placementScope||['brand_profile','discover_feed'],!!p.isPaid,p.sponsorLabelRu||null,p.sponsorLabelEn||null,p.frequencyCap||{per_user_per_7d:2},p.status,p.moderationNote||null,p.publishedAt||null,p.createdAt||null]);
    }
  }
}

module.exports={Brand365Store};
