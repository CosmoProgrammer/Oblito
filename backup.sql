--
-- PostgreSQL database dump
--

\restrict J7Ne0audGJeresftXmOux2jhw7KTh7QenzfxMlCqBOQRYSfnfP95V34CU7um74R

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: full_order_status; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.full_order_status AS ENUM (
    'pending',
    'processed',
    'delivered',
    'cancelled'
);


ALTER TYPE public.full_order_status OWNER TO oblito_user;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processed',
    'shipped',
    'delivered',
    'cancelled',
    'to_return',
    'returned'
);


ALTER TYPE public.order_status OWNER TO oblito_user;

--
-- Name: order_type; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.order_type AS ENUM (
    'retail',
    'wholesale'
);


ALTER TYPE public.order_type OWNER TO oblito_user;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.payment_method AS ENUM (
    'credit_card',
    'upi',
    'cash_on_delivery',
    'razorpay'
);


ALTER TYPE public.payment_method OWNER TO oblito_user;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE public.payment_status OWNER TO oblito_user;

--
-- Name: query_status; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.query_status AS ENUM (
    'open',
    'answered',
    'closed'
);


ALTER TYPE public.query_status OWNER TO oblito_user;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: oblito_user
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'retailer',
    'wholesaler'
);


ALTER TYPE public.user_role OWNER TO oblito_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    street_address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    location point NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_primary boolean DEFAULT false
);


ALTER TABLE public.addresses OWNER TO oblito_user;

--
-- Name: browsing_history; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.browsing_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.browsing_history OWNER TO oblito_user;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    shop_inventory_id uuid NOT NULL,
    quantity numeric NOT NULL
);


ALTER TABLE public.cart_items OWNER TO oblito_user;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL
);


ALTER TABLE public.carts OWNER TO oblito_user;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    parent_id uuid,
    image_url text
);


ALTER TABLE public.categories OWNER TO oblito_user;

--
-- Name: customer_queries; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.customer_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    query text NOT NULL,
    response text,
    status public.query_status DEFAULT 'open'::public.query_status NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_queries OWNER TO oblito_user;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    shop_inventory_id uuid,
    warehouse_inventory_id uuid,
    quantity numeric NOT NULL,
    price_at_purchase numeric NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL
);


ALTER TABLE public.order_items OWNER TO oblito_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    order_type public.order_type NOT NULL,
    shop_id uuid,
    warehouse_id uuid,
    status public.full_order_status DEFAULT 'pending'::public.full_order_status NOT NULL,
    total_amount numeric NOT NULL,
    payment_method public.payment_method NOT NULL,
    payment_id text,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    delivery_address_id uuid,
    offline_order_delivery_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO oblito_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    amount numeric NOT NULL,
    payment_method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    transaction_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO oblito_user;

--
-- Name: products; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category_id uuid,
    image_urls text[] DEFAULT '{}'::text[],
    creator_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO oblito_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reviews OWNER TO oblito_user;

--
-- Name: shop_inventory; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.shop_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    stock_quantity numeric DEFAULT '0'::numeric NOT NULL,
    is_proxy_item boolean DEFAULT false NOT NULL,
    warehouse_inventory_id uuid,
    price numeric NOT NULL
);


ALTER TABLE public.shop_inventory OWNER TO oblito_user;

--
-- Name: shops; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.shops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text,
    description text,
    address_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.shops OWNER TO oblito_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    phone text,
    password_hash text,
    first_name text,
    last_name text,
    role public.user_role NOT NULL,
    google_id text,
    facebook_id text,
    created_at timestamp with time zone DEFAULT now(),
    profile_picture_url text,
    otp text,
    otp_expires_at timestamp with time zone,
    otp_attempts integer DEFAULT 0
);


ALTER TABLE public.users OWNER TO oblito_user;

--
-- Name: warehouse_inventory; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.warehouse_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    warehouse_id uuid NOT NULL,
    product_id uuid NOT NULL,
    stock_quantity numeric DEFAULT '0'::numeric NOT NULL,
    price numeric NOT NULL
);


ALTER TABLE public.warehouse_inventory OWNER TO oblito_user;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: oblito_user
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text,
    address_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO oblito_user;

--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.addresses (id, user_id, street_address, city, state, postal_code, country, location, created_at, is_primary) FROM stdin;
26386c0d-1f3e-4e32-98e9-3ebcb03f6aed	167a0614-c17d-45fb-ad37-02c95f857a07	123 Main Street	Hyderabad	Telangana	909090	India	(78.4358918,17.4540865)	2025-11-23 10:36:52.445831+00	f
e20301e1-841e-4764-98fc-af84e37289fe	167a0614-c17d-45fb-ad37-02c95f857a07	123 Street Jain	Hyderabad	Telangana	909090	India	(0,0)	2025-11-23 10:38:05.612995+00	t
a4a5fd0b-75e7-4548-a35a-b24830d29c13	37380435-f4ab-446d-a50c-098633f2b75e	123 Main Street	Bangalore 	Karnataka	909090	India	(77.6319693,12.9758989)	2025-11-23 12:45:46.340564+00	f
969866dd-b499-4cad-84f7-79c49bef9489	37380435-f4ab-446d-a50c-098633f2b75e	123 MAIN STREET	HYDERABAD	TELANGANA	909090	INDIA	(78.4358918,17.4540865)	2025-11-23 12:46:26.318317+00	t
\.


--
-- Data for Name: browsing_history; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.browsing_history (id, user_id, product_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.cart_items (id, cart_id, shop_inventory_id, quantity) FROM stdin;
5a60d617-7071-4b4c-941f-02e308ce9751	54e2ab53-41cb-4919-9a97-f39f2eb7b246	14521630-5cc3-408f-8b1d-ba201e1b08f0	1
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.carts (id, customer_id) FROM stdin;
9162c7ce-71e3-4d2e-bf48-3615d1b548d9	167a0614-c17d-45fb-ad37-02c95f857a07
914b25bd-bef0-4d3b-9fcd-be4f8e98c3dd	37380435-f4ab-446d-a50c-098633f2b75e
54e2ab53-41cb-4919-9a97-f39f2eb7b246	1241a433-c73d-49a9-9562-9de3e7204804
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.categories (id, name, description, parent_id, image_url) FROM stdin;
d21cf0d5-55aa-47c0-9915-9787095c61d7	Electronics	Electronic items and gadgets	\N	\N
1b527a80-f3e6-4193-bda1-38429a568978	Clothing	Apparel and garments	\N	\N
e478ce19-68e2-410d-911e-edce1bfd3560	Home	Home and kitchen items	\N	\N
e17daa9d-f415-4045-ac4a-d647076b597a	Sports	Sports and outdoor equipment	\N	\N
495ac5cd-2500-4ea3-8ea0-64199a24bad0	Books	Books and media	\N	\N
61e2ac49-bf03-465a-848b-56e5fa2c32da	Beauty	Beauty and personal care	\N	\N
073831d2-3756-4831-ac6e-eb5e0adf02f7	Toys	Toys and games	\N	\N
e6e8151a-379c-4548-add4-cab6e6db4ee1	Furniture	Furniture and decor	\N	\N
feb2b7da-63cc-404b-acca-5934312a626e	Food	Food and beverages	\N	\N
4a116777-c818-4e95-be4b-8581bad3e9b5	Automotive	Automotive accessories and parts	\N	\N
\.


--
-- Data for Name: customer_queries; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.customer_queries (id, customer_id, product_id, query, response, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.order_items (id, order_id, shop_inventory_id, warehouse_inventory_id, quantity, price_at_purchase, status) FROM stdin;
5b555266-18c5-418b-b617-ed70a33ce955	735ebfa7-1bf0-4831-bb0d-abfc78ee049c	\N	85078a59-52ed-47d3-af83-db250137f657	20	399	delivered
3c038cea-50ee-47a1-aa05-abc4765bd8a6	9ac7bbca-4346-4544-8e27-18930517f2b4	\N	042537b3-7f8b-400b-98ec-b37cd86c3c0b	15	749	delivered
82c180d4-dca4-4163-95fa-ca4c92683b97	77ec487e-9f6a-4796-9457-23bf97df8999	\N	3325f9ca-0d3a-4acd-b3f8-f29e9aa1ebf9	10	1299	delivered
81bb1d2f-f1c3-43b3-8703-925173cc6e85	f994e242-415e-4736-99dd-2d408aec0409	\N	36335b2c-dfd6-4ae0-83f8-548003462486	25	119	delivered
7b70311c-4c03-45d1-b197-de9e5d534652	b7705274-a683-4984-8bf8-9344127d4680	\N	a0603a64-f982-4240-91fc-974b6f45c8ec	18	168	delivered
fc75ee51-c061-4bd0-9aa9-3fe9500c7399	05b64879-deda-4179-85d7-d729b1e79765	\N	4de253a6-416f-4a67-9fd2-2154c7919528	35	149	delivered
253e2e6e-0514-45a8-a9b2-37da4798e955	0376f997-ca79-4e06-9e4c-aa76868a0a3f	\N	55e2016d-02f8-419e-a6d8-283c73217979	10	699	delivered
615fcf2d-db78-4e75-a45a-4a2efa9a1b8b	7c98743a-16cf-4738-ad3b-086ef10eecfc	\N	31284bcb-52e9-4ea7-be10-65c52d5108d7	10	589	delivered
afac1624-2868-4b3b-a0c9-b8b3c768e647	0c829354-9f41-4c65-9c7d-5c2368a76d25	\N	94e854ee-85ad-4083-aa02-513b2b7a1084	15	294	delivered
9ba2a13e-633c-44ca-9f92-2efd4d7a1d31	80b9acb0-6ca9-48a7-a50a-d23108f0d3b9	\N	6118fcca-da15-4bc4-a605-a12114a06955	28	238	delivered
9252642f-dc6b-4bb0-a14a-4f1e2db84da8	7c92627c-2bcc-4021-96d6-0f270e8a9621	c3d0a1f7-959b-4cfa-8d5e-bbd515a9db8f	31284bcb-52e9-4ea7-be10-65c52d5108d7	1	589	shipped
c9bc14af-55d9-4ef1-9606-a3bf1c0b1c4c	7c92627c-2bcc-4021-96d6-0f270e8a9621	aca17724-0a5f-48b5-baee-519d604a54fe	55e2016d-02f8-419e-a6d8-283c73217979	1	699	to_return
b23c67e8-0e4b-40cf-909d-f92cce3795d6	8b4c2eb7-160c-4487-8e07-7a77090ffefc	14521630-5cc3-408f-8b1d-ba201e1b08f0	\N	1	160	pending
bfbb3846-176e-4826-af7f-a1998bb7aaed	8b4c2eb7-160c-4487-8e07-7a77090ffefc	046ea93d-559c-4140-b0eb-70bd8a6a8539	\N	1	2289	pending
18158aeb-43e7-4834-91bf-ede52835a915	1d9f71dc-d58b-4ab6-a8fa-159711728e3e	7e546bf5-c5d1-49d7-96b3-8d0141629543	042537b3-7f8b-400b-98ec-b37cd86c3c0b	1	749	to_return
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.orders (id, customer_id, order_type, shop_id, warehouse_id, status, total_amount, payment_method, payment_id, payment_status, delivery_address_id, offline_order_delivery_date, created_at, updated_at) FROM stdin;
735ebfa7-1bf0-4831-bb0d-abfc78ee049c	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	wholesale	\N	c210a24e-8739-433c-8321-8d3677e4c71b	delivered	7980	cash_on_delivery	\N	pending	\N	\N	2025-11-23 09:38:56.580402+00	2025-11-23 09:38:56.580402+00
9ac7bbca-4346-4544-8e27-18930517f2b4	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	wholesale	\N	71e1e790-1d25-47c7-843a-6f2aa054eff2	delivered	11235	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:02:09.77898+00	2025-11-23 10:02:09.77898+00
77ec487e-9f6a-4796-9457-23bf97df8999	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	wholesale	\N	c210a24e-8739-433c-8321-8d3677e4c71b	delivered	12990	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:01:46.597101+00	2025-11-23 10:01:46.597101+00
f994e242-415e-4736-99dd-2d408aec0409	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	wholesale	\N	c1d59e81-60a2-4d38-93c6-8a6ef7384873	delivered	2975	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:20:36.010088+00	2025-11-23 10:20:36.010088+00
b7705274-a683-4984-8bf8-9344127d4680	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	wholesale	\N	c1d59e81-60a2-4d38-93c6-8a6ef7384873	delivered	3024	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:21:15.70838+00	2025-11-23 10:21:15.70838+00
05b64879-deda-4179-85d7-d729b1e79765	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	wholesale	\N	c210a24e-8739-433c-8321-8d3677e4c71b	delivered	5215	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:28:36.087815+00	2025-11-23 10:28:36.087815+00
0376f997-ca79-4e06-9e4c-aa76868a0a3f	8ace1958-96ec-49b6-85e7-90e470f68320	wholesale	\N	71e1e790-1d25-47c7-843a-6f2aa054eff2	delivered	6990	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:31:24.536904+00	2025-11-23 10:31:24.536904+00
7c98743a-16cf-4738-ad3b-086ef10eecfc	8ace1958-96ec-49b6-85e7-90e470f68320	wholesale	\N	71e1e790-1d25-47c7-843a-6f2aa054eff2	delivered	5890	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:31:12.966344+00	2025-11-23 10:31:12.966344+00
0c829354-9f41-4c65-9c7d-5c2368a76d25	8ace1958-96ec-49b6-85e7-90e470f68320	wholesale	\N	c1d59e81-60a2-4d38-93c6-8a6ef7384873	delivered	4410	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:33:04.067279+00	2025-11-23 10:33:04.067279+00
80b9acb0-6ca9-48a7-a50a-d23108f0d3b9	8ace1958-96ec-49b6-85e7-90e470f68320	wholesale	\N	c1d59e81-60a2-4d38-93c6-8a6ef7384873	delivered	6664	cash_on_delivery	\N	pending	\N	\N	2025-11-23 10:32:44.406728+00	2025-11-23 10:32:44.406728+00
7c92627c-2bcc-4021-96d6-0f270e8a9621	167a0614-c17d-45fb-ad37-02c95f857a07	retail	fb3f7069-e3d8-4840-a586-df143c3af6f5	\N	processed	1288	razorpay	pay_Rj9SWSLMx6hoXW	completed	e20301e1-841e-4764-98fc-af84e37289fe	\N	2025-11-23 10:39:28.555574+00	2025-11-23 10:39:28.555574+00
8b4c2eb7-160c-4487-8e07-7a77090ffefc	37380435-f4ab-446d-a50c-098633f2b75e	retail	aaf65333-91d2-4317-b53b-e7f40114166e	\N	pending	2449	razorpay	pay_RjBeQBOlPihiyL	completed	969866dd-b499-4cad-84f7-79c49bef9489	\N	2025-11-23 12:48:07.477458+00	2025-11-23 12:48:07.477458+00
1d9f71dc-d58b-4ab6-a8fa-159711728e3e	37380435-f4ab-446d-a50c-098633f2b75e	retail	f509c1a3-60d8-4a04-914d-10359983d8ea	\N	delivered	749	razorpay	pay_RjBeQBOlPihiyL	completed	969866dd-b499-4cad-84f7-79c49bef9489	\N	2025-11-23 12:48:07.477458+00	2025-11-23 12:48:07.477458+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.payments (id, order_id, amount, payment_method, status, transaction_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.products (id, name, description, category_id, image_urls, creator_id, created_at) FROM stdin;
21314874-aef0-4ed6-a865-c81922ef2f5f	Tshirt for Men	FABRIC: Cotton-polyester blend for perfect shape retention and easy maintenance.\nPRODUCT DETAILS: Regular fit, featuring a ribbed knit collar and cuff, 2 -button placket, half sleeves and side slits for movement.	1b527a80-f3e6-4193-bda1-38429a568978	{"https://oblito.s3.eu-north-1.amazonaws.com/products/35e9038d2785d6d430a39ed01d4b3206-61X Yx14SEL._SY879_.jpg",https://oblito.s3.eu-north-1.amazonaws.com/products/27e238005ddc73e2abb57628f6abae93-81-IrK4ZyCL._SY879_.jpg,https://oblito.s3.eu-north-1.amazonaws.com/products/485940d9b8d08924deb7e71b823da4ec-81AZzaCss-L._SY879_.jpg,"https://oblito.s3.eu-north-1.amazonaws.com/products/7916afba18d4063cec79f56e63e72927-713n TxyfCL._SY879_.jpg"}	1728050f-8c76-473e-96d1-4f1f22e05a50	2025-11-23 09:34:06.829515+00
89dbd156-b512-4d3f-8f07-47c9763a2579	Phone Charger for iPhone	Single USB 2.4A Port: Adapto 12 is a 2.4A wall adaptor, which lets you power up all your USB gadgets with a single adapter—no more need to carry multiple chargers.	d21cf0d5-55aa-47c0-9915-9787095c61d7	{"https://oblito.s3.eu-north-1.amazonaws.com/products/11d9a4eb437dae2d8f4508bd0f8da047-Screenshot 2025-11-23 at 2.21.18 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/f52419eaf265f386185ab4314885e296-Screenshot 2025-11-23 at 2.21.27 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/4b67c986c6118cb1b49f6ab1d430e5d3-Screenshot 2025-11-23 at 2.21.35 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/512792e41b4a47470019421a4e9f84c3-Screenshot 2025-11-23 at 2.21.44 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/e38b3fa43bd59f187cbc00d97e924bc2-Screenshot 2025-11-23 at 2.21.55 PM.png"}	1728050f-8c76-473e-96d1-4f1f22e05a50	2025-11-23 09:43:04.689574+00
fbdf050d-8150-4833-9da6-203854ae101e	Men's Cap for Summer	LIGHTWEIGHT & PREMIUM-QUALITY FABRIC FOR MAXIMUM COMFORT: The Boldfit cap is designed with high-quality, ultra-lightweight fabric that provides all-day comfort and durability. Whether you're working out, playing sports, or heading for a casual stroll, this mens caps delivers superior breathability and sweat absorption. The sleek black design adds a stylish edge, making it an essential accessory for everyday wear, from gym sessions to outdoor adventures.	1b527a80-f3e6-4193-bda1-38429a568978	{https://oblito.s3.eu-north-1.amazonaws.com/products/1e93858f73af0d26ee78858552a256d4-61h-Ptbu7YL._SX679_.jpg,https://oblito.s3.eu-north-1.amazonaws.com/products/40eb133b7faaa23e886d72187deee5a4-61UquCWAOpL._SX679_.jpg,https://oblito.s3.eu-north-1.amazonaws.com/products/140404a6149e8046666ccf4cb9eb1ec3-617PZ-sRX3L._SX679_.jpg}	1728050f-8c76-473e-96d1-4f1f22e05a50	2025-11-23 09:44:46.063285+00
ee20eda8-0ecf-4e9a-8e33-c500784404bf	Tennis Rackets, Super Lightweight Tennis Racquets for Student	Heavy Construction For Exceptional Performance\nLightweight, strong impact resistance\nHead Shape:- Oval Shape\nGood shock absorption effect, bring better hitting feeling	e17daa9d-f415-4045-ac4a-d647076b597a	{"https://oblito.s3.eu-north-1.amazonaws.com/products/d35754195a72e7497745a71d6d579c47-Screenshot 2025-11-23 at 3.16.16 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/638451bf7a8e2ee69951d9b98e44ce4f-Screenshot 2025-11-23 at 3.16.29 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/649b7926d02c062ac9d18ab9482d34c8-Screenshot 2025-11-23 at 3.16.43 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/7d63c801dde4b4f3be3a55fa1b0ee5fc-Screenshot 2025-11-23 at 3.16.59 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/2da10fed15e0a24fbb5d2287dcc7aec8-Screenshot 2025-11-23 at 3.17.07 PM.png"}	1728050f-8c76-473e-96d1-4f1f22e05a50	2025-11-23 09:48:13.89239+00
6f9a40b3-2b49-452f-a1b1-1224b58a09f9	Read People Like a Book Hardcover – by Patrick King	Speed read people, decipher body language, detect lies, and understand human nature.Is it possible to analyze people without them saying a word? Yes, it is. Learn how to become a "mind reader" and forge deep connections.	495ac5cd-2500-4ea3-8ea0-64199a24bad0	{"https://oblito.s3.eu-north-1.amazonaws.com/products/e03c88703d538ee5d73dd6ccf419b558-Screenshot 2025-11-23 at 3.20.41 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/24f6de166b90c3f7442bad214f7fd047-Screenshot 2025-11-23 at 3.20.52 PM.png"}	c2e76f60-53d0-4327-8efc-4c875efde4da	2025-11-23 09:52:09.310593+00
8cd80045-0acc-4af5-82c0-785a4936f9dd	All Direction Movement Dancing Robot Toys for Boys and Girls	PREMIUM QUALITY: VGRASSP Bot Robot Pioneer is made of quality material, safe, simple and easy to use. Absolutely Safe for your Kids as it is Non-Toxic and goes through product safety certification inspection... buy once and enjoy for years!	073831d2-3756-4831-ac6e-eb5e0adf02f7	{"https://oblito.s3.eu-north-1.amazonaws.com/products/a0abd30e25efc3f8f433f5e401eca191-Screenshot 2025-11-23 at 3.23.00 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/c884083d0827390ffdc96c7b56afd191-Screenshot 2025-11-23 at 3.23.27 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/3bdeccd4739243e99b672f84e360b0e6-Screenshot 2025-11-23 at 3.23.16 PM.png"}	c2e76f60-53d0-4327-8efc-4c875efde4da	2025-11-23 09:55:01.268106+00
b2fa502f-5a24-48c5-8ed9-02ef804591ef	Apple 2025 MacBook Air (13-inch, Apple M4 chip with 10-core CPU and 8-core GPU, 16GB Unified Memory, 256GB) - Sky Blue	SPEED OF LIGHTNESS — MacBook Air with the M4 chip lets you blaze through work and play. With Apple Intelligence,* up to 18 hours of battery life,* and an incredibly portable design, you can take on anything, anywhere.\nSUPERCHARGED BY M4 — The Apple M4 chip brings even more speed and fluidity to everything you do, like working between multiple apps, editing videos or playing graphically demanding games.\nBUILT FOR APPLE INTELLIGENCE — Apple Intelligence is the personal intelligence system that helps you write, express yourself and get things done effortlessly. With groundbreaking privacy protections, it gives you peace of mind that no one else can access your data — not even Apple.*	d21cf0d5-55aa-47c0-9915-9787095c61d7	{"https://oblito.s3.eu-north-1.amazonaws.com/products/8915e5e3562530dec32e7388a0e42b82-Screenshot 2025-11-23 at 3.25.51 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/5520d3bf97833534da0e10ea0f0d93d2-Screenshot 2025-11-23 at 3.26.24 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/42edf209d78fe7213692cebfa5964e73-Screenshot 2025-11-23 at 3.26.17 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/74a045ae91697a2496868c9a86db8545-Screenshot 2025-11-23 at 3.26.08 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/feebc6d4158745141c1492bcf8e277a6-Screenshot 2025-11-23 at 3.26.00 PM.png"}	c2e76f60-53d0-4327-8efc-4c875efde4da	2025-11-23 09:57:56.193662+00
11cc9cd5-48a9-4535-ba65-1c6e2cc37b61	Majestic Geometric Lion Sculpture	Bold Emblem of Strength & Success Represents leadership, confidence, and personal power, making it ideal for professionals, achievers, and dreamers alike.	e478ce19-68e2-410d-911e-edce1bfd3560	{"https://oblito.s3.eu-north-1.amazonaws.com/products/0f4aada36e4fa8af8e9157983056af57-Screenshot 2025-11-23 at 3.28.56 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/10c7e5877d5e284250946d65d853624f-Screenshot 2025-11-23 at 3.29.04 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/13de2966a78ed284cd3daa9250e97ebd-Screenshot 2025-11-23 at 3.29.13 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/ea5eb7f9b56970f59e34d6e794f46128-Screenshot 2025-11-23 at 3.29.31 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/0c02c6e34cc61c214369155e901f3422-Screenshot 2025-11-23 at 3.29.38 PM.png"}	c2e76f60-53d0-4327-8efc-4c875efde4da	2025-11-23 10:00:51.674994+00
c6b8e86d-a83c-4f19-beea-bcd34cf1eedb	Shoe Rack 4 Tier Shoe Rack With SHELF	Compact Design: This 4-tier stackable shoe rack is perfect for organising shoes in small spaces like homes, offices, bedrooms, living rooms, kitchens, bathrooms, closets, and entryways.	e6e8151a-379c-4548-add4-cab6e6db4ee1	{"https://oblito.s3.eu-north-1.amazonaws.com/products/7ad5255e11aa5319096c2acce303abdb-Screenshot 2025-11-23 at 3.33.28 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/a94d213cbd774798ec22c07b27924feb-Screenshot 2025-11-23 at 3.33.39 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/9b654eca6d932f9119df086594791525-Screenshot 2025-11-23 at 3.33.49 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/d215e4355d3a6bde7ab20cd238606317-Screenshot 2025-11-23 at 3.34.00 PM.png"}	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	2025-11-23 10:05:53.053736+00
e32c49f2-4a6a-4c34-b6f9-4d6c47f814a8	Sunfeast Dark Fantasy Choco Fills	SUNFEAST DARK FANTASY CHOCO FILLS: A one-of-a-kind cookie you can indulge in for an unforgettable chocolate experience	feb2b7da-63cc-404b-acca-5934312a626e	{"https://oblito.s3.eu-north-1.amazonaws.com/products/75ec94253537805b33140eb977768df3-Screenshot 2025-11-23 at 3.36.36 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/64e94728aefdf9454feebbeffab944a0-Screenshot 2025-11-23 at 3.36.54 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/f31246a87c2b07db1abac68361c03ca4-Screenshot 2025-11-23 at 3.36.44 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/cf6f5adff7ee666d1d4d2638d738bec9-Screenshot 2025-11-23 at 3.37.17 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/646991092f8c22b291b15315189257ba-Screenshot 2025-11-23 at 3.37.07 PM.png"}	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	2025-11-23 10:08:11.170898+00
2f96f6b1-67e7-4ec0-b386-80b8e9faf940	Godrej aer O – Hanging Car Air Freshener	CONTAINS: 3 units of Godrej aer O – Hanging Car Air Freshener perfume - Assorted Pack (22.5g)\nLONG-LASTING: Unique membrane technology that removes bad odour by releasing a pleasant fragrance continuously and keeps the car fragrant for up to 30 days	4a116777-c818-4e95-be4b-8581bad3e9b5	{"https://oblito.s3.eu-north-1.amazonaws.com/products/86541969345b938535afb7ad52f4bcdd-Screenshot 2025-11-23 at 3.40.43 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/a061bc6e3e4c7d348741c1cafa22b256-Screenshot 2025-11-23 at 3.40.50 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/89a5a2e5a01b57156e52f5627983362a-Screenshot 2025-11-23 at 3.40.58 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/d02a5551cf2d1f2f8b65c0307c3ae2e9-Screenshot 2025-11-23 at 3.41.08 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/25f4d5957f371dd5c8d3f38941f1a6bc-Screenshot 2025-11-23 at 3.41.19 PM.png"}	45549738-97e6-4d22-af57-7aab94fb9623	2025-11-23 10:12:31.970007+00
be4f146c-e586-4b68-80d5-7d6022bcd38e	NIVEA Pearl and Beauty 50ml Deo Underarm Roll On	Provides 48 hours of effective protection\nIt contains precious pearl extracts that give a mild, soothing fragrance and keep you fresh all day long.All skin types\nIt contains anti-microbial agents that help keep bacteria away thus giving long lasting odour control	61e2ac49-bf03-465a-848b-56e5fa2c32da	{"https://oblito.s3.eu-north-1.amazonaws.com/products/ad1b89372d0d341baf03b917d0a97b25-Screenshot 2025-11-23 at 3.43.35 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/89e7afec0a48580dee2c61bd40aeace6-Screenshot 2025-11-23 at 3.43.43 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/b31a318a9cba2f07ffcf69215dc3be9c-Screenshot 2025-11-23 at 3.43.52 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/b980e8ef1e5aed5c0ab1659e5fe07b10-Screenshot 2025-11-23 at 3.44.04 PM.png"}	45549738-97e6-4d22-af57-7aab94fb9623	2025-11-23 10:14:33.877445+00
d47e9cad-876c-4865-88a1-975724b70956	Maybelline New York Intense Colour Colossal Kajal, Black, Matte Finish	Deep, dark intense black colour with sharp definition, Long lasting smudge proof and waterproof formula\nFor eyes that look fresh all day long	61e2ac49-bf03-465a-848b-56e5fa2c32da	{"https://oblito.s3.eu-north-1.amazonaws.com/products/5beb2b19295df7a9be02493ad8897f84-Screenshot 2025-11-23 at 3.44.48 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/005f21c85b9d7aa7ed4ffe782c29a0f0-Screenshot 2025-11-23 at 3.44.59 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/c7a6ea03eb1b25462ccb81ecf44ee7e6-Screenshot 2025-11-23 at 3.45.10 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/e9dc170a1e8fbb441d3990e4ec179924-Screenshot 2025-11-23 at 3.45.20 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/3df51e46f39e994994ada4b69a043c79-Screenshot 2025-11-23 at 3.45.29 PM.png"}	45549738-97e6-4d22-af57-7aab94fb9623	2025-11-23 10:16:25.478428+00
a4becaaf-ee69-4da7-b5c6-469f6d4104f7	Auto Specialty Glass Cleaner	CAR GLASS CLEANING- Streak-free formula puts the sparkle and shine back into automotive glass. Bringing back clear view on glass.\nMULTI GLASS SURFACE CLEANING – Use on all glass surfaces, including windshields, windows and mirrors.\n	4a116777-c818-4e95-be4b-8581bad3e9b5	{"https://oblito.s3.eu-north-1.amazonaws.com/products/03c6eb296028826940340a838413323f-Screenshot 2025-11-23 at 3.47.55 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/29db09e9334475bb78988cd41aaa552f-Screenshot 2025-11-23 at 3.48.04 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/3713c8ac31f8f3643ddd1d651a1bcf12-Screenshot 2025-11-23 at 3.48.11 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/1ec9cdca02bb1448905a44a3dab5e755-Screenshot 2025-11-23 at 3.48.19 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/20139b256400f463af3d7e0e290e6039-Screenshot 2025-11-23 at 3.48.27 PM.png"}	45549738-97e6-4d22-af57-7aab94fb9623	2025-11-23 10:19:28.594613+00
7f4806ab-d224-4846-b572-c24027221253	Sports Carbonix Carbon Table Tennis Racket with Stylish Cover Bag	ADVANCED CARBON TECHNOLOGY: Yait Sports Carbonix Carbon Table Tennis Racquet/ TT Racquet has Integrated carbon layers enhance energy transfer, delivering explosive speed, improved precision, and a larger sweet spot for consistent performance	e17daa9d-f415-4045-ac4a-d647076b597a	{"https://oblito.s3.eu-north-1.amazonaws.com/products/d53e329bbace30a054be9ef97416b2f5-Screenshot 2025-11-23 at 3.52.51 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/421f3c547e1a31215b7d32e6e9682285-Screenshot 2025-11-23 at 3.53.01 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/5bc8c90b654633f62f729093c2761072-Screenshot 2025-11-23 at 3.53.10 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/a1d7374f55ec33f1084260133421a60c-Screenshot 2025-11-23 at 3.53.22 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/0c9bab78f9cc04085c23d34f69cdd075-Screenshot 2025-11-23 at 3.53.33 PM.png"}	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	2025-11-23 10:24:07.349987+00
4e7533b2-f104-4590-bdb7-03e7e97fbbdf	MAGGI 2-Minute Instant Noodles	INSTANT MASALA NOODLES: Relish your favorite masala taste with MAGGI 2-Minute Instant Noodles	feb2b7da-63cc-404b-acca-5934312a626e	{"https://oblito.s3.eu-north-1.amazonaws.com/products/80d1a1607e955cdb2e921bcd77defa71-Screenshot 2025-11-23 at 3.55.19 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/4f4bff2f887766098b58097f546ad734-Screenshot 2025-11-23 at 3.55.25 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/f1a978b9c31e4d51561ada1a76735a14-Screenshot 2025-11-23 at 3.55.39 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/c6a9cb8ed94aacabf049a77c4c50ac54-Screenshot 2025-11-23 at 3.55.50 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/baeb29b9dbd0ae639344e4f0d89b6e91-Screenshot 2025-11-23 at 3.56.01 PM.png"}	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	2025-11-23 10:26:29.23378+00
6a004b88-2b95-4926-904b-c913cd93a1d7	Mirada Black Panda Soft Face Toy	Unique Soft Face Design: Features a distinctive black panda face, offering a playful and cute look for kids	073831d2-3756-4831-ac6e-eb5e0adf02f7	{"https://oblito.s3.eu-north-1.amazonaws.com/products/c8f0639c6d66ba96acffa4d9fc7e9bb5-Screenshot 2025-11-23 at 4.12.46 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/ceaf7d18f6846fc7bcabc9f72b5ebea8-Screenshot 2025-11-23 at 4.12.52 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/8ebcd745f9a1e0e7ed589a02ee528ffb-Screenshot 2025-11-23 at 4.12.58 PM.png","https://oblito.s3.eu-north-1.amazonaws.com/products/209eb77689cbfb119ef559159f56294c-Screenshot 2025-11-23 at 4.13.14 PM.png"}	8ace1958-96ec-49b6-85e7-90e470f68320	2025-11-23 10:44:17.139576+00
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.reviews (id, customer_id, product_id, rating, comment, created_at) FROM stdin;
1a939240-285c-427e-8975-296712d5182c	167a0614-c17d-45fb-ad37-02c95f857a07	c3d0a1f7-959b-4cfa-8d5e-bbd515a9db8f	5	Good toy for children, highly recommend 	2025-11-23 10:41:09.534781+00
4a994911-d7cb-4d37-a713-0893ecf87799	167a0614-c17d-45fb-ad37-02c95f857a07	aca17724-0a5f-48b5-baee-519d604a54fe	4	Good book, helped my a lot with my difficulties\nGive it a go!	2025-11-23 10:41:37.805245+00
d557876a-145f-4ba1-b2e6-59c26d4915c9	167a0614-c17d-45fb-ad37-02c95f857a07	266c9412-59d0-425d-ab02-d8b7e23642c0	5	Best snack in the world!!	2025-11-23 10:42:01.827224+00
fbd56d27-a58a-4412-ac7d-76bc84b7ee21	167a0614-c17d-45fb-ad37-02c95f857a07	14521630-5cc3-408f-8b1d-ba201e1b08f0	5	Really tasty! 	2025-11-23 10:44:47.057776+00
9f3b1fab-d0e2-4c96-a115-892e3eb77b84	167a0614-c17d-45fb-ad37-02c95f857a07	5722c514-43ca-4831-8af5-aff39318d2aa	5	Very effective and smells very good!	2025-11-23 10:45:10.00986+00
6a0ab389-1054-439b-8706-3dfadc7b1a64	37380435-f4ab-446d-a50c-098633f2b75e	14521630-5cc3-408f-8b1d-ba201e1b08f0	5	Very good and inexpensive!	2025-11-23 10:45:42.415745+00
abf1d180-263b-419c-ab93-2dae2385f114	37380435-f4ab-446d-a50c-098633f2b75e	7e546bf5-c5d1-49d7-96b3-8d0141629543	4	Nice and good quality!	2025-11-23 10:46:00.454711+00
4ba003bf-10fb-4c8d-b94c-761e3782d533	37380435-f4ab-446d-a50c-098633f2b75e	34050eab-4b35-4e16-bbff-387d86bf39c0	5	Soft and soo cute!	2025-11-23 10:46:51.025743+00
803128d4-fb81-41f0-8e80-ccbcc4b3b5ed	1241a433-c73d-49a9-9562-9de3e7204804	14521630-5cc3-408f-8b1d-ba201e1b08f0	2	Not good, tastes very cheap	2025-11-23 10:48:08.92456+00
65d7c5ee-8dee-417d-ba02-38c32451b3d3	1241a433-c73d-49a9-9562-9de3e7204804	34050eab-4b35-4e16-bbff-387d86bf39c0	3	Good product, not very durable though	2025-11-23 10:48:40.778376+00
\.


--
-- Data for Name: shop_inventory; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.shop_inventory (id, shop_id, product_id, stock_quantity, is_proxy_item, warehouse_inventory_id, price) FROM stdin;
005158a3-0b54-4056-898d-4c604e098398	f509c1a3-60d8-4a04-914d-10359983d8ea	21314874-aef0-4ed6-a865-c81922ef2f5f	20	f	85078a59-52ed-47d3-af83-db250137f657	399
1bc1329a-a00d-4029-b3be-566377289577	f509c1a3-60d8-4a04-914d-10359983d8ea	c6b8e86d-a83c-4f19-beea-bcd34cf1eedb	25	f	\N	289
266c9412-59d0-425d-ab02-d8b7e23642c0	f509c1a3-60d8-4a04-914d-10359983d8ea	e32c49f2-4a6a-4c34-b6f9-4d6c47f814a8	50	f	\N	210
81453a2c-a8c1-463b-aaa5-732af1bcf143	f509c1a3-60d8-4a04-914d-10359983d8ea	ee20eda8-0ecf-4e9a-8e33-c500784404bf	10	f	3325f9ca-0d3a-4acd-b3f8-f29e9aa1ebf9	1299
a7d831c4-2115-42ba-bca2-c2c893970f27	aaf65333-91d2-4317-b53b-e7f40114166e	d47e9cad-876c-4865-88a1-975724b70956	25	f	36335b2c-dfd6-4ae0-83f8-548003462486	119
9c4b8d88-0520-49fa-9acc-f4b294917808	aaf65333-91d2-4317-b53b-e7f40114166e	be4f146c-e586-4b68-80d5-7d6022bcd38e	18	f	a0603a64-f982-4240-91fc-974b6f45c8ec	168
7676950e-6212-4ba8-9f83-29cec00a2353	aaf65333-91d2-4317-b53b-e7f40114166e	fbdf050d-8150-4833-9da6-203854ae101e	35	f	4de253a6-416f-4a67-9fd2-2154c7919528	149
d6679242-8c03-44cd-905b-021ae8074bf2	fb3f7069-e3d8-4840-a586-df143c3af6f5	a4becaaf-ee69-4da7-b5c6-469f6d4104f7	15	f	94e854ee-85ad-4083-aa02-513b2b7a1084	294
5722c514-43ca-4831-8af5-aff39318d2aa	fb3f7069-e3d8-4840-a586-df143c3af6f5	2f96f6b1-67e7-4ec0-b386-80b8e9faf940	28	f	6118fcca-da15-4bc4-a605-a12114a06955	238
c3d0a1f7-959b-4cfa-8d5e-bbd515a9db8f	fb3f7069-e3d8-4840-a586-df143c3af6f5	8cd80045-0acc-4af5-82c0-785a4936f9dd	9	f	31284bcb-52e9-4ea7-be10-65c52d5108d7	589
aca17724-0a5f-48b5-baee-519d604a54fe	fb3f7069-e3d8-4840-a586-df143c3af6f5	6f9a40b3-2b49-452f-a1b1-1224b58a09f9	9	f	55e2016d-02f8-419e-a6d8-283c73217979	699
34050eab-4b35-4e16-bbff-387d86bf39c0	fb3f7069-e3d8-4840-a586-df143c3af6f5	6a004b88-2b95-4926-904b-c913cd93a1d7	33	f	\N	299
7e546bf5-c5d1-49d7-96b3-8d0141629543	f509c1a3-60d8-4a04-914d-10359983d8ea	11cc9cd5-48a9-4535-ba65-1c6e2cc37b61	14	f	042537b3-7f8b-400b-98ec-b37cd86c3c0b	749
14521630-5cc3-408f-8b1d-ba201e1b08f0	aaf65333-91d2-4317-b53b-e7f40114166e	4e7533b2-f104-4590-bdb7-03e7e97fbbdf	59	f	\N	160
046ea93d-559c-4140-b0eb-70bd8a6a8539	aaf65333-91d2-4317-b53b-e7f40114166e	7f4806ab-d224-4846-b572-c24027221253	9	f	\N	2289
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.shops (id, owner_id, name, description, address_id, created_at) FROM stdin;
f509c1a3-60d8-4a04-914d-10359983d8ea	7ab9afb7-2185-426d-a40e-7ea72a3a44c8	Bob's Shop	Shop for Bob	\N	2025-11-23 09:24:12.072286+00
aaf65333-91d2-4317-b53b-e7f40114166e	094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	David's Shop	Shop for David	\N	2025-11-23 09:24:12.072757+00
fb3f7069-e3d8-4840-a586-df143c3af6f5	8ace1958-96ec-49b6-85e7-90e470f68320	Emma's Shop	Shop for Emma	\N	2025-11-23 09:24:12.072993+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.users (id, email, phone, password_hash, first_name, last_name, role, google_id, facebook_id, created_at, profile_picture_url, otp, otp_expires_at, otp_attempts) FROM stdin;
167a0614-c17d-45fb-ad37-02c95f857a07	alice@example.com	\N	$2b$10$VR2hzT4paumrVovrYPnnUeVCTW42pqLw30tpbMRqjshMSShm/Hm5u	Alice	Anderson	customer	\N	\N	2025-11-23 09:24:12.067073+00	\N	\N	\N	0
7ab9afb7-2185-426d-a40e-7ea72a3a44c8	bob@example.com	\N	$2b$10$ZppfabKWqp4CF2LHTqbMvewsT3xW6Huwoz7SDZNG38cSYIs.z0QJ6	Bob	Brown	retailer	\N	\N	2025-11-23 09:24:12.068428+00	\N	\N	\N	0
c2e76f60-53d0-4327-8efc-4c875efde4da	carol@example.com	\N	$2b$10$uy0FaF02iZ.lk8cwLmMwuuKFLuFqbqm/KpY004xPltq4rYG.lSHpi	Carol	Clark	wholesaler	\N	\N	2025-11-23 09:24:12.068788+00	\N	\N	\N	0
094bb2b4-1b8b-4d3f-b7a8-d787255bec6f	david@example.com	\N	$2b$10$hpIKW/4dz/1LvM40TBPLbO6QgSwdLN0E1siArlVcHCDB0biRItvyK	David	Davis	retailer	\N	\N	2025-11-23 09:24:12.069144+00	\N	\N	\N	0
8ace1958-96ec-49b6-85e7-90e470f68320	emma@example.com	\N	$2b$10$xL1uXgWvqL0TxOjTdV4tAewHWbqGMPJecTRyWizWtzcmsZDhsrhM6	Emma	Evans	retailer	\N	\N	2025-11-23 09:24:12.069429+00	\N	\N	\N	0
45549738-97e6-4d22-af57-7aab94fb9623	frank@example.com	\N	$2b$10$F0Tbv3bX2XJVfyh5yOAwd.r3cRjjpSWtGnqLtd.LDSkyFvQxLCj5.	Frank	Franklin	wholesaler	\N	\N	2025-11-23 09:24:12.069741+00	\N	\N	\N	0
1728050f-8c76-473e-96d1-4f1f22e05a50	grace@example.com	\N	$2b$10$R8tposs9wPktBuHh4WuUZusqiosoA4o8vHmrMuU7ehTD4FVaXqW1u	Grace	Green	wholesaler	\N	\N	2025-11-23 09:24:12.070027+00	\N	\N	\N	0
37380435-f4ab-446d-a50c-098633f2b75e	f20240154@hyderabad.bits-pilani.ac.in	\N	\N	Saharsh	Patnaik	customer	110233359314228324537	\N	2025-11-23 09:24:44.57232+00	https://lh3.googleusercontent.com/a/ACg8ocL7pT4DdzN81uRHpOVFcpRmsHs1faUFlsD0BLtGA99YxHvs=s96-c	\N	\N	0
1241a433-c73d-49a9-9562-9de3e7204804	harshul@gmail.com	\N	$2b$10$OkdI./9q/zQUR79tRd4BOOPvLBfqQSihRs/KNF9MWEWjYgj84KYGG	Harshul	Agarwal	customer	\N	\N	2025-11-23 10:47:47.15406+00	\N	\N	\N	0
\.


--
-- Data for Name: warehouse_inventory; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.warehouse_inventory (id, warehouse_id, product_id, stock_quantity, price) FROM stdin;
85078a59-52ed-47d3-af83-db250137f657	c210a24e-8739-433c-8321-8d3677e4c71b	21314874-aef0-4ed6-a865-c81922ef2f5f	10	399
b079f823-9ae2-4ad3-8237-bf0e2d6e554d	c210a24e-8739-433c-8321-8d3677e4c71b	89dbd156-b512-4d3f-8f07-47c9763a2579	30	169
e38c8943-9bef-4bd2-9656-f69e525b8738	71e1e790-1d25-47c7-843a-6f2aa054eff2	b2fa502f-5a24-48c5-8ed9-02ef804591ef	10	90000
3325f9ca-0d3a-4acd-b3f8-f29e9aa1ebf9	c210a24e-8739-433c-8321-8d3677e4c71b	ee20eda8-0ecf-4e9a-8e33-c500784404bf	15	1299
042537b3-7f8b-400b-98ec-b37cd86c3c0b	71e1e790-1d25-47c7-843a-6f2aa054eff2	11cc9cd5-48a9-4535-ba65-1c6e2cc37b61	20	749
36335b2c-dfd6-4ae0-83f8-548003462486	c1d59e81-60a2-4d38-93c6-8a6ef7384873	d47e9cad-876c-4865-88a1-975724b70956	15	119
a0603a64-f982-4240-91fc-974b6f45c8ec	c1d59e81-60a2-4d38-93c6-8a6ef7384873	be4f146c-e586-4b68-80d5-7d6022bcd38e	12	168
4de253a6-416f-4a67-9fd2-2154c7919528	c210a24e-8739-433c-8321-8d3677e4c71b	fbdf050d-8150-4833-9da6-203854ae101e	15	149
31284bcb-52e9-4ea7-be10-65c52d5108d7	71e1e790-1d25-47c7-843a-6f2aa054eff2	8cd80045-0acc-4af5-82c0-785a4936f9dd	10	589
55e2016d-02f8-419e-a6d8-283c73217979	71e1e790-1d25-47c7-843a-6f2aa054eff2	6f9a40b3-2b49-452f-a1b1-1224b58a09f9	5	699
6118fcca-da15-4bc4-a605-a12114a06955	c1d59e81-60a2-4d38-93c6-8a6ef7384873	2f96f6b1-67e7-4ec0-b386-80b8e9faf940	12	238
94e854ee-85ad-4083-aa02-513b2b7a1084	c1d59e81-60a2-4d38-93c6-8a6ef7384873	a4becaaf-ee69-4da7-b5c6-469f6d4104f7	15	294
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: oblito_user
--

COPY public.warehouses (id, owner_id, name, address_id, created_at) FROM stdin;
71e1e790-1d25-47c7-843a-6f2aa054eff2	c2e76f60-53d0-4327-8efc-4c875efde4da	Carol's Warehouse	\N	2025-11-23 09:24:12.073246+00
c1d59e81-60a2-4d38-93c6-8a6ef7384873	45549738-97e6-4d22-af57-7aab94fb9623	Frank's Warehouse	\N	2025-11-23 09:24:12.073703+00
c210a24e-8739-433c-8321-8d3677e4c71b	1728050f-8c76-473e-96d1-4f1f22e05a50	Grace's Warehouse	\N	2025-11-23 09:24:12.073903+00
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: browsing_history browsing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.browsing_history
    ADD CONSTRAINT browsing_history_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_cart_id_shop_inventory_id_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_shop_inventory_id_unique UNIQUE (cart_id, shop_inventory_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customer_queries customer_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.customer_queries
    ADD CONSTRAINT customer_queries_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: shop_inventory shop_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shop_inventory
    ADD CONSTRAINT shop_inventory_pkey PRIMARY KEY (id);


--
-- Name: shop_inventory shop_inventory_shop_id_product_id_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shop_inventory
    ADD CONSTRAINT shop_inventory_shop_id_product_id_unique UNIQUE (shop_id, product_id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_facebook_id_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_facebook_id_unique UNIQUE (facebook_id);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouse_inventory warehouse_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_pkey PRIMARY KEY (id);


--
-- Name: warehouse_inventory warehouse_inventory_warehouse_id_product_id_unique; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_warehouse_id_product_id_unique UNIQUE (warehouse_id, product_id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: products_name_trgm_index; Type: INDEX; Schema: public; Owner: oblito_user
--

CREATE INDEX products_name_trgm_index ON public.products USING gin (name public.gin_trgm_ops);


--
-- Name: products_search_vector_index; Type: INDEX; Schema: public; Owner: oblito_user
--

CREATE INDEX products_search_vector_index ON public.products USING gin (to_tsvector('english'::regconfig, ((name || ' '::text) || COALESCE(description, ''::text))));


--
-- Name: shops_name_trgm_index; Type: INDEX; Schema: public; Owner: oblito_user
--

CREATE INDEX shops_name_trgm_index ON public.shops USING gin (name public.gin_trgm_ops);


--
-- Name: warehouses_name_trgm_index; Type: INDEX; Schema: public; Owner: oblito_user
--

CREATE INDEX warehouses_name_trgm_index ON public.warehouses USING gin (name public.gin_trgm_ops);


--
-- Name: addresses addresses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: browsing_history browsing_history_product_id_shop_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.browsing_history
    ADD CONSTRAINT browsing_history_product_id_shop_inventory_id_fk FOREIGN KEY (product_id) REFERENCES public.shop_inventory(id) ON DELETE CASCADE;


--
-- Name: browsing_history browsing_history_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.browsing_history
    ADD CONSTRAINT browsing_history_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_carts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_carts_id_fk FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_shop_inventory_id_shop_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_shop_inventory_id_shop_inventory_id_fk FOREIGN KEY (shop_inventory_id) REFERENCES public.shop_inventory(id) ON DELETE CASCADE;


--
-- Name: carts carts_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_categories_id_fk FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: customer_queries customer_queries_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.customer_queries
    ADD CONSTRAINT customer_queries_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: customer_queries customer_queries_product_id_shop_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.customer_queries
    ADD CONSTRAINT customer_queries_product_id_shop_inventory_id_fk FOREIGN KEY (product_id) REFERENCES public.shop_inventory(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_shop_inventory_id_shop_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_shop_inventory_id_shop_inventory_id_fk FOREIGN KEY (shop_inventory_id) REFERENCES public.shop_inventory(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_warehouse_inventory_id_warehouse_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_warehouse_inventory_id_warehouse_inventory_id_fk FOREIGN KEY (warehouse_inventory_id) REFERENCES public.warehouse_inventory(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_delivery_address_id_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_address_id_addresses_id_fk FOREIGN KEY (delivery_address_id) REFERENCES public.addresses(id) ON DELETE RESTRICT;


--
-- Name: orders orders_shop_id_shops_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shop_id_shops_id_fk FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE SET NULL;


--
-- Name: orders orders_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_shop_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_shop_inventory_id_fk FOREIGN KEY (product_id) REFERENCES public.shop_inventory(id) ON DELETE CASCADE;


--
-- Name: shop_inventory shop_inventory_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shop_inventory
    ADD CONSTRAINT shop_inventory_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shop_inventory shop_inventory_shop_id_shops_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shop_inventory
    ADD CONSTRAINT shop_inventory_shop_id_shops_id_fk FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: shop_inventory shop_inventory_warehouse_inventory_id_warehouse_inventory_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shop_inventory
    ADD CONSTRAINT shop_inventory_warehouse_inventory_id_warehouse_inventory_id_fk FOREIGN KEY (warehouse_inventory_id) REFERENCES public.warehouse_inventory(id) ON DELETE SET NULL;


--
-- Name: shops shops_address_id_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_address_id_addresses_id_fk FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- Name: shops shops_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: warehouse_inventory warehouse_inventory_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: warehouse_inventory warehouse_inventory_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_address_id_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_address_id_addresses_id_fk FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- Name: warehouses warehouses_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: oblito_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict J7Ne0audGJeresftXmOux2jhw7KTh7QenzfxMlCqBOQRYSfnfP95V34CU7um74R

