-- A listing's "viewable by everyone" RLS policy only covers status = 'active'
-- or the seller viewing their own row. Once a sold listing's status flips to
-- 'sold', the BUYER can no longer see that listing row at all — so the
-- listings(...) embed on their own orders comes back null and crashes the
-- Orders/Balance screens. Let anyone with an order on a listing keep seeing it.

create policy "Order participants can view listings from their orders"
  on public.listings for select using (
    exists (
      select 1 from public.orders
      where orders.listing_id = listings.id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
  );
