import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react'
import './AgricultureHub.css'
import { jsPDF } from 'jspdf'

const categoryInfo = {
  'Cereals & Millets': { icon: '🌾', soil: 'Soil texture and drainage needs differ substantially between rice, wheat and dryland millets.', climate: 'Choose a variety matched to local temperature, rainfall pattern and season.', water: 'Rice generally needs more managed water; millets are often more drought tolerant once established.', guidance: 'Use locally recommended varieties, timely sowing and integrated weed management.' },
  'Pulses': { icon: '🫘', soil: 'Well-drained soils are important; avoid prolonged waterlogging.', climate: 'Most pulses suit warm conditions, but sowing windows differ by species.', water: 'Avoid excess irrigation; protect flowering and pod formation from moisture stress.', guidance: 'Use quality seed, suitable rhizobium inoculation where recommended and crop rotation.' },
  'Vegetables': { icon: '🥬', soil: 'Fertile, well-drained soil with organic matter; soil pH should be checked locally.', climate: 'Temperature and season requirements are crop- and variety-specific.', water: 'Maintain even soil moisture, especially during flowering and fruit development.', guidance: 'Use healthy seedlings, mulch where suitable and scout frequently for pests.' },
  'Fruits': { icon: '🍎', soil: 'Deep, well-drained soil is important for most fruit crops; avoid stagnant water.', climate: 'Select cultivars and rootstocks suited to local climate and chilling/rainfall conditions.', water: 'Young orchards need establishment irrigation; mature trees need stage-based water management.', guidance: 'Plan spacing, pruning, nutrition and orchard sanitation over multiple seasons.' },
  'Commercial & Fibre Crops': { icon: '🌿', soil: 'Soil depth, drainage and fertility requirements depend on the crop.', climate: 'Use regionally recommended varieties and planting windows.', water: 'Match irrigation to crop stage and local rainfall; prevent waterlogging where harmful.', guidance: 'Plan crop protection, harvest labour and market access before planting.' },
  'Oilseeds': { icon: '🌻', soil: 'Well-drained soil supports healthy roots and seed development.', climate: 'Sowing time and temperature tolerance vary across oilseed crops.', water: 'Avoid waterlogging; moisture at flowering and seed filling is often important.', guidance: 'Use certified seed, timely sowing and locally advised nutrient management.' },
  'Spices & Plantation Crops': { icon: '🌶️', soil: 'Many prefer friable, organic-matter-rich soil with good drainage.', climate: 'Humidity, shade and temperature needs differ widely by crop.', water: 'Maintain moisture without stagnant water; mulch and drainage may be useful.', guidance: 'Use disease-free planting material and plan shade, spacing and post-harvest handling.' },
  'Flowers': { icon: '🌸', soil: 'Fertile, well-drained soil with suitable structure and organic matter.', climate: 'Flowering response depends on variety, temperature, light and planting date.', water: 'Avoid moisture stress during bud formation and waterlogging around roots.', guidance: 'Plan market timing, harvest stage, grading and quick post-harvest handling.' }
}

const rawCrops = [
  // Cereals and millets
  ['Rice','Cereals & Millets','rice.jpg','🌾','Kharif; some regions also grow Rabi rice','120–150 days','West Bengal, Uttar Pradesh, Punjab, Andhra Pradesh, Telangana'],
  ['Wheat','Cereals & Millets','wheat.jpg','🌾','Rabi: usually sown October–December','110–150 days','Uttar Pradesh, Madhya Pradesh, Punjab, Haryana'],
  ['Maize','Cereals & Millets','maize.jpg','🌽','Kharif, Rabi and summer depending on region','90–120 days','Karnataka, Madhya Pradesh, Bihar, Telangana'],
  ['Ragi','Cereals & Millets','ragi.jpg','🌾','Mostly Kharif; varies by region','100–120 days','Karnataka, Tamil Nadu, Uttarakhand'],
  ['Jowar','Cereals & Millets','jowar.jpg','🌾','Kharif and Rabi','100–120 days','Maharashtra, Karnataka, Telangana'],
  ['Bajra','Cereals & Millets','bajra.jpg','🌾','Mainly Kharif','75–100 days','Rajasthan, Gujarat, Haryana'],
  ['Barley','Cereals & Millets','barley.jpg','🌾','Rabi season','120–150 days','Rajasthan, Uttar Pradesh, Haryana'],

  // Pulses
  ['Toor Dal','Pulses','toor-dal.jpg','🫘','Kharif','150–180 days','Karnataka, Maharashtra, Madhya Pradesh'],
  ['Chickpea','Pulses','chickpea.jpg','🫘','Rabi season','90–120 days','Madhya Pradesh, Rajasthan, Maharashtra'],
  ['Green Gram','Pulses','green-gram.jpg','🫘','Kharif, summer','60–75 days','Rajasthan, Maharashtra, Karnataka'],
  ['Black Gram','Pulses','black-gram.jpg','🫘','Kharif and Rabi','70–90 days','Andhra Pradesh, Madhya Pradesh, Uttar Pradesh'],
  ['Lentil','Pulses','lentil.jpg','🫘','Rabi season','100–120 days','Uttar Pradesh, Madhya Pradesh, Bihar'],

  // Vegetables
  ['Tomato','Vegetables','tomato.jpg','🍅','Can be grown in several seasons','90–120 days','Andhra Pradesh, Karnataka, Madhya Pradesh'],
  ['Potato','Vegetables','potato.jpg','🥔','Mostly Rabi in plains','90–120 days','Uttar Pradesh, West Bengal, Bihar'],
  ['Onion','Vegetables','onion.jpg','🧅','Kharif, late Kharif and Rabi','100–150 days','Maharashtra, Karnataka, Madhya Pradesh'],
  ['Carrot','Vegetables','carrot.jpg','🥕','Cool-season crop','90–120 days','Haryana, Punjab, Uttar Pradesh'],
  ['Brinjal','Vegetables','brinjal.jpg','🍆','Can be grown through much of the year','100–150 days','West Bengal, Odisha, Gujarat'],
  ['Cabbage','Vegetables','cabbage.jpg','🥬','Mostly cool season','90–120 days','West Bengal, Odisha, Bihar'],

  // Fruits
  ['Mango','Fruits','mango.jpg','🥭','Flowering and harvest seasons vary by region','Several years to first major harvest','Uttar Pradesh, Andhra Pradesh, Karnataka'],
  ['Banana','Fruits','banana.jpg','🍌','Planting possible in suitable warm seasons','11–15 months','Tamil Nadu, Maharashtra, Gujarat'],
  ['Guava','Fruits','guava.jpg','🍈','Multiple flowering seasons','2–3 years to fruiting','Uttar Pradesh, Madhya Pradesh, Bihar'],
  ['Papaya','Fruits','papaya.jpg','🍈','Can be planted in suitable warm seasons','9–12 months to first harvest','Andhra Pradesh, Gujarat, Karnataka'],
  ['Orange','Fruits','orange.jpg','🍊','Planting generally during suitable rainy periods','3–5 years to commercial bearing','Maharashtra, Madhya Pradesh, Rajasthan'],

  // Commercial and fibre
  ['Cotton','Commercial & Fibre Crops','cotton.jpg','🌱','Kharif','150–180 days','Gujarat, Maharashtra, Telangana'],
  ['Sugarcane','Commercial & Fibre Crops','sugarcane.jpg','🎋','Planting seasons vary by region','10–18 months','Uttar Pradesh, Maharashtra, Karnataka'],
  ['Jute','Commercial & Fibre Crops','jute.jpg','🌿','Mostly Kharif','100–150 days','West Bengal, Assam, Bihar'],
  ['Tobacco','Commercial & Fibre Crops','tobacco.jpg','🍃','Season varies by type and region','90–120 days','Andhra Pradesh, Gujarat, Karnataka'],
  ['Kenaf','Commercial & Fibre Crops','kenaf.jpg','🌿','Mostly warm rainy season','120–150 days','West Bengal, Odisha, Assam'],

  // Oilseeds
  ['Groundnut','Oilseeds','groundnut.jpg','🥜','Kharif and Rabi in suitable regions','100–130 days','Gujarat, Rajasthan, Tamil Nadu'],
  ['Sunflower','Oilseeds','sunflower.jpg','🌻','Kharif, Rabi and summer','90–110 days','Karnataka, Maharashtra, Andhra Pradesh'],
  ['Mustard','Oilseeds','mustard.jpg','🌼','Rabi season','110–140 days','Rajasthan, Haryana, Uttar Pradesh'],
  ['Soybean','Oilseeds','soybean.jpg','🌱','Kharif season','90–120 days','Madhya Pradesh, Maharashtra, Rajasthan'],
  ['Sesame','Oilseeds','sesame.jpg','🌱','Kharif and summer','80–100 days','Gujarat, Rajasthan, West Bengal'],

  // Spices and plantation
  ['Turmeric','Spices & Plantation Crops','turmeric.jpg','🟠','Usually planted before or during monsoon','7–9 months','Telangana, Maharashtra, Tamil Nadu'],
  ['Ginger','Spices & Plantation Crops','ginger.jpg','🫚','Usually planted before or during monsoon','8–9 months','Kerala, Karnataka, Meghalaya'],
  ['Chilli','Spices & Plantation Crops','chilli.jpg','🌶️','Kharif and Rabi depending on region','120–180 days','Andhra Pradesh, Telangana, Karnataka'],
  ['Black Pepper','Spices & Plantation Crops','black-pepper.jpg','🫑','Planting during rainy season','3–4 years to bearing','Kerala, Karnataka, Tamil Nadu'],
  ['Cardamom','Spices & Plantation Crops','cardamom.jpg','🌿','Planting during rainy season','2–3 years to bearing','Kerala, Karnataka, Tamil Nadu'],

  // Flowers
  ['Rose','Flowers','rose.jpg','🌹','Planting season depends on climate and variety','Varies by variety','Karnataka, Tamil Nadu, Maharashtra'],
  ['Jasmine','Flowers','jasmine.jpg','🌼','Planting often during rainy periods','6–12 months to flowering','Tamil Nadu, Karnataka, Andhra Pradesh'],
  ['Marigold','Flowers','marigold.jpg','🌼','Several planting seasons are possible','60–90 days','Karnataka, Maharashtra, West Bengal'],
  ['Chrysanthemum','Flowers','chrysanthemum.jpg','🌸','Usually grown in suitable cool-season conditions','90–120 days','Karnataka, Tamil Nadu, West Bengal'],
  // Additional cereals and millets
  ['Foxtail Millet','Cereals & Millets','foxtail-millet.jpg','🌾','Kharif and Rabi depending on region','85–100 days','Andhra Pradesh, Karnataka, Tamil Nadu'],
  ['Little Millet','Cereals & Millets','little-millet.jpg','🌾','Mostly Kharif','90–110 days','Karnataka, Tamil Nadu, Odisha'],
  ['Kodo Millet','Cereals & Millets','kodo-millet.jpg','🌾','Kharif season','100–120 days','Madhya Pradesh, Chhattisgarh, Tamil Nadu'],
  ['Barnyard Millet','Cereals & Millets','barnyard-millet.jpg','🌾','Kharif and summer','80–100 days','Uttarakhand, Uttar Pradesh, Tamil Nadu'],
  ['Proso Millet','Cereals & Millets','proso-millet.jpg','🌾','Kharif season','60–90 days','Madhya Pradesh, Karnataka, Andhra Pradesh'],
  ['Oats','Cereals & Millets','oats.jpg','🌾','Rabi season','100–120 days','Punjab, Haryana, Uttar Pradesh'],
  ['Rye','Cereals & Millets','rye.jpg','🌾','Cool-season crop','100–120 days','Himachal Pradesh, Jammu and Kashmir'],
  ['Triticale','Cereals & Millets','triticale.jpg','🌾','Rabi season','110–130 days','Himachal Pradesh, Punjab, Haryana'],

  // Additional pulses
  ['Cowpea','Pulses','cowpea.jpg','🫘','Kharif and summer','60–90 days','Karnataka, Tamil Nadu, Rajasthan'],
  ['Horse Gram','Pulses','horse-gram.jpg','🫘','Kharif and Rabi','100–120 days','Karnataka, Andhra Pradesh, Odisha'],
  ['Field Bean','Pulses','field-bean.jpg','🫘','Kharif and Rabi','90–120 days','Karnataka, Tamil Nadu, Andhra Pradesh'],
  ['Moth Bean','Pulses','moth-bean.jpg','🫘','Kharif season','75–90 days','Rajasthan, Gujarat, Haryana'],
  ['Dry Peas','Pulses','dry-peas.jpg','🫘','Rabi season','90–120 days','Uttar Pradesh, Madhya Pradesh, Bihar'],
  ['Kidney Bean','Pulses','kidney-bean.jpg','🫘','Kharif season','90–120 days','Jammu and Kashmir, Himachal Pradesh, Uttarakhand'],
  ['Broad Bean','Pulses','broad-bean.jpg','🫘','Rabi season','90–120 days','Himachal Pradesh, Uttarakhand, Jammu and Kashmir'],
  ['Lima Bean','Pulses','lima-bean.jpg','🫘','Kharif and Rabi','90–120 days','Karnataka, Tamil Nadu, Maharashtra'],

  // Additional vegetables
  ['Okra','Vegetables','okra.jpg','🥬','Kharif and summer','45–60 days to first harvest','Gujarat, Andhra Pradesh, Karnataka'],
  ['Cauliflower','Vegetables','cauliflower.jpg','🥬','Mainly cool season','90–120 days','West Bengal, Bihar, Uttar Pradesh'],
  ['Cucumber','Vegetables','cucumber.jpg','🥒','Summer and rainy seasons','50–70 days','Karnataka, Uttar Pradesh, Telangana'],
  ['Pumpkin','Vegetables','pumpkin.jpg','🎃','Kharif and summer','90–120 days','Odisha, Uttar Pradesh, Karnataka'],
  ['Bitter Gourd','Vegetables','bitter-gourd.jpg','🥬','Warm-season crop','55–70 days','Karnataka, Maharashtra, Tamil Nadu'],
  ['Bottle Gourd','Vegetables','bottle-gourd.jpg','🥬','Warm-season crop','60–90 days','Uttar Pradesh, Bihar, West Bengal'],
  ['Ridge Gourd','Vegetables','ridge-gourd.jpg','🥬','Summer and rainy seasons','60–75 days','Karnataka, Andhra Pradesh, Maharashtra'],
  ['Snake Gourd','Vegetables','snake-gourd.jpg','🥬','Warm and humid season','90–120 days','Tamil Nadu, Kerala, Karnataka'],
  ['Capsicum','Vegetables','capsicum.jpg','🫑','Cool and mild seasons','90–120 days','Karnataka, Himachal Pradesh, Maharashtra'],
  ['Spinach','Vegetables','spinach.jpg','🥬','Cool season and suitable mild climates','40–60 days','Uttar Pradesh, West Bengal, Karnataka'],
  ['Amaranth','Vegetables','amaranth.jpg','🥬','Warm-season crop','30–50 days','Tamil Nadu, Kerala, Karnataka'],
  ['Beetroot','Vegetables','beetroot.jpg','🥕','Cool-season crop','55–70 days','Haryana, Uttar Pradesh, Maharashtra'],
  ['Radish','Vegetables','radish.jpg','🥕','Cool-season crop','40–60 days','West Bengal, Bihar, Uttar Pradesh'],
  ['Garlic','Vegetables','garlic.jpg','🧄','Mostly Rabi season','120–150 days','Madhya Pradesh, Rajasthan, Gujarat'],

  // Additional fruits
  ['Pomegranate','Fruits','pomegranate.jpg','🍎','Planting seasons vary by region','2–3 years to bearing','Maharashtra, Karnataka, Gujarat'],
  ['Watermelon','Fruits','watermelon.jpg','🍉','Summer crop','80–100 days','Uttar Pradesh, Karnataka, Andhra Pradesh'],
  ['Muskmelon','Fruits','muskmelon.jpg','🍈','Summer crop','80–100 days','Uttar Pradesh, Punjab, Rajasthan'],
  ['Grapes','Fruits','grapes.jpg','🍇','Planting during suitable dormant season','2–3 years to bearing','Maharashtra, Karnataka, Tamil Nadu'],
  ['Pineapple','Fruits','pineapple.jpg','🍍','Can be planted in suitable rainy periods','15–24 months','Assam, West Bengal, Kerala'],
  ['Sapota','Fruits','sapota.jpg','🍐','Planting during suitable rainy periods','3–5 years to bearing','Karnataka, Gujarat, Maharashtra'],
  ['Jackfruit','Fruits','jackfruit.jpg','🍈','Monsoon planting is common','4–7 years to bearing','Kerala, Karnataka, Assam'],
  ['Lemon','Fruits','lemon.jpg','🍋','Planting during suitable rainy periods','2–3 years to bearing','Andhra Pradesh, Maharashtra, Gujarat'],
  ['Litchi','Fruits','litchi.jpg','🍒','Planting during monsoon','4–5 years to bearing','Bihar, West Bengal, Jharkhand'],
  ['Custard Apple','Fruits','custard-apple.jpg','🍈','Monsoon planting is common','3–4 years to bearing','Maharashtra, Madhya Pradesh, Telangana'],

  // Additional commercial crops
  ['Coffee','Commercial & Fibre Crops','coffee.jpg','🌱','Planting during monsoon','3–4 years to bearing','Karnataka, Kerala, Tamil Nadu'],
  ['Tea','Commercial & Fibre Crops','tea.jpg','🌱','Planting in suitable rainy periods','3–5 years to regular plucking','Assam, West Bengal, Tamil Nadu'],
  ['Rubber','Commercial & Fibre Crops','rubber.jpg','🌱','Planting during rainy season','6–7 years to tapping','Kerala, Tripura, Karnataka'],
  ['Arecanut','Commercial & Fibre Crops','arecanut.jpg','🌴','Monsoon planting','5–7 years to bearing','Karnataka, Kerala, Assam'],
  ['Cocoa','Commercial & Fibre Crops','cocoa.jpg','🌱','Planting during rainy season','3–5 years to bearing','Kerala, Karnataka, Andhra Pradesh'],

  // Additional oilseeds
  ['Castor','Oilseeds','castor.jpg','🌻','Mostly Kharif','150–180 days','Gujarat, Rajasthan, Telangana'],
  ['Linseed','Oilseeds','linseed.jpg','🌻','Rabi season','120–150 days','Madhya Pradesh, Uttar Pradesh, Bihar'],
  ['Safflower','Oilseeds','safflower.jpg','🌻','Rabi season','110–140 days','Maharashtra, Karnataka, Telangana'],
  ['Niger Seed','Oilseeds','niger-seed.jpg','🌻','Kharif season','90–110 days','Odisha, Maharashtra, Karnataka'],
  ['Coconut','Oilseeds','coconut.jpg','🥥','Year-round tropical cultivation','5–7 years to bearing','Kerala, Tamil Nadu, Karnataka'],

  // Additional spices and plantation crops
  ['Coriander','Spices & Plantation Crops','coriander.jpg','🌿','Rabi season','90–120 days','Rajasthan, Madhya Pradesh, Gujarat'],
  ['Cumin','Spices & Plantation Crops','cumin.jpg','🌿','Rabi season','100–120 days','Gujarat, Rajasthan'],
  ['Fenugreek','Spices & Plantation Crops','fenugreek.jpg','🌿','Rabi season','90–110 days','Rajasthan, Gujarat, Madhya Pradesh'],
  ['Clove','Spices & Plantation Crops','clove.jpg','🌿','Planting during rainy season','6–8 years to bearing','Kerala, Tamil Nadu, Karnataka'],
  ['Nutmeg','Spices & Plantation Crops','nutmeg.jpg','🌿','Planting during rainy season','6–8 years to bearing','Kerala, Karnataka, Tamil Nadu'],
  ['Vanilla','Spices & Plantation Crops','vanilla.jpg','🌿','Planting during rainy season','3–4 years to flowering','Kerala, Karnataka, Tamil Nadu'],
  ['Cinnamon','Spices & Plantation Crops','cinnamon.jpg','🌿','Warm humid growing conditions','2–3 years for first harvest','Kerala, Karnataka, Tamil Nadu'],

  // Additional flowers
  ['Tuberose','Flowers','tuberose.jpg','🌸','Planting season varies by region','90–120 days to flowering','West Bengal, Karnataka, Tamil Nadu'],
  ['Gladiolus','Flowers','gladiolus.jpg','🌸','Cool and mild growing season','60–90 days to flowering','West Bengal, Maharashtra, Karnataka'],
  ['Hibiscus','Flowers','hibiscus.jpg','🌺','Warm-season perennial','Varies by variety','Tamil Nadu, Kerala, Karnataka']
]

const cropNotes = {
  'Rice': ['Choose a locally released variety for irrigated, rainfed lowland or upland conditions; use healthy seed and a suitable nursery or direct-seeding method.', 'Keep water management matched to the field system; avoid unnecessary continuous flooding and ensure safe drainage before harvest.', 'Watch for weeds, stem borer, planthoppers, blast and bacterial leaf blight; identify the problem before choosing any control.', 'Harvest when most grains have reached the locally recommended maturity stage; dry promptly and store clean, dry grain.'],
  'Wheat': ['Select a timely-sown, locally recommended variety; prepare a fine, level seedbed and sow at the recommended window for the region.', 'Give priority to irrigation at crown-root initiation and other locally critical stages; avoid excess water and lodging.', 'Scout for weeds, rusts, aphids and termites; use resistant varieties and integrated management.', 'Harvest when plants and grains are mature and dry the produce safely before storage.'],
  'Maize': ['Select grain, sweet corn, fodder or specialty maize according to purpose; use quality seed and maintain recommended plant population.', 'Provide moisture around establishment, tasseling, silking and grain filling; avoid waterlogging.', 'Monitor fall armyworm, stem borers, weeds and leaf diseases; inspect whorls and follow integrated pest management.', 'Harvest cobs at the correct maturity for the intended use and dry grain to safe storage moisture.'],
  'Ragi': ['Choose a locally adapted finger millet variety; use line sowing or healthy transplanted seedlings as recommended in the area.', 'Establish the crop uniformly and manage moisture during establishment, flowering and grain formation; it is relatively hardy but not stress-proof.', 'Control early weeds and monitor blast and shoot-fly where locally prevalent.', 'Harvest when fingers and grains mature; dry well and thresh carefully.'],
  'Jowar': ['Choose a variety suited to Kharif or Rabi conditions and local end use; use clean seed and recommended spacing.', 'Conserve soil moisture through timely sowing and suitable interculture; protect the crop around flowering and grain filling.', 'Scout for shoot fly, stem borer, grain mould and weeds; remove severely affected plants where advised.', 'Harvest mature earheads, dry thoroughly and store grain safely.'],
  'Bajra': ['Select a locally recommended pearl millet hybrid or variety suited to rainfall and soil; use quality seed and timely sowing.', 'Establish a uniform stand and conserve moisture with timely interculture; avoid water stagnation.', 'Monitor downy mildew, ergot, smut and shoot fly; resistant seed and field sanitation are important.', 'Harvest earheads at maturity and dry before threshing and storage.'],
  'Barley': ['Choose a variety for grain, malt or fodder use and the local sowing window; prepare a firm seedbed.', 'Irrigation need is usually lower than wheat but critical stages still matter; avoid lodging from excess water or nitrogen.', 'Scout for weeds, rusts and aphids and use locally recommended integrated management.', 'Harvest when straw and ears are mature and grain is hard; dry before storage.'],
  'Toor Dal': ['Use locally recommended pigeonpea varieties matching maturity duration and intercropping plan; treat seed only as advised locally.', 'Ensure good drainage and avoid waterlogging; moisture during flowering and pod filling supports pod development.', 'Monitor wilt, sterility mosaic, pod fly and pod borers; use clean seed, resistant varieties and field scouting.', 'Pick or harvest when pods turn mature brown; dry pods before threshing and store seed dry.'],
  'Chickpea': ['Choose a suitable desi or kabuli variety; sow into a well-drained seedbed in the recommended Rabi window.', 'Avoid excess irrigation; protect flowering and pod filling from severe moisture stress.', 'Watch for Fusarium wilt, dry root rot, pod borer and weeds; rotate crops and use healthy seed.', 'Harvest when plants dry and pods turn mature; dry grain before safe storage.'],
  'Green Gram': ['Select a short-duration variety suited to the season; use clean seed and timely sowing for uniform flowering.', 'Avoid waterlogging and provide moisture during flowering and pod formation if rainfall is insufficient.', 'Monitor yellow mosaic virus, whitefly, powdery mildew and pod borers; remove virus-affected plants where advised.', 'Harvest pods as they mature, often in more than one picking, to reduce shattering losses.'],
  'Black Gram': ['Choose a locally recommended variety and sow at the right Kharif, Rabi or summer window.', 'Maintain drainage and avoid prolonged wet foliage; moisture during flowering and pod filling is important.', 'Scout for yellow mosaic virus, whitefly, leaf crinkle and pod borers; use healthy seed and field sanitation.', 'Pick mature pods in time to reduce shattering; dry before threshing and storage.'],
  'Lentil': ['Use locally recommended seed and sow in a well-drained field at the appropriate Rabi time.', 'Usually needs limited irrigation; avoid waterlogging and excess vegetative growth.', 'Monitor rust, wilt, aphids and pod borer; rotate crops and remove crop residues as locally advised.', 'Harvest when lower pods are mature and plants begin drying; avoid delays that cause shattering.'],
  'Tomato': ['Choose varieties or hybrids suited to open field or protected cultivation and local disease pressure; raise healthy seedlings.', 'Use staking or support where suitable; maintain even moisture, especially during flowering and fruit setting.', 'Scout for fruit borer, whitefly, leaf curl, early blight and bacterial wilt; remove infected material and use integrated controls.', 'Pick fruits at the maturity stage required by the market and handle gently to reduce bruising.'],
  'Potato': ['Use certified, healthy seed tubers of suitable size and variety; prepare loose, well-drained ridges or beds.', 'Maintain moisture during tuber initiation and bulking; avoid waterlogging and moisture fluctuations.', 'Monitor late blight, early blight, aphids and tuber moth; use healthy seed and field sanitation.', 'Harvest after skin set and vine maturity; cure and store tubers in a cool, dark, ventilated place.'],
  'Onion': ['Select varieties for Kharif, late Kharif or Rabi and raise healthy seedlings where transplanting is practised.', 'Maintain consistent moisture during bulb development, then reduce irrigation before harvest as locally advised.', 'Monitor thrips, purple blotch and basal rot; ensure good airflow and avoid prolonged leaf wetness.', 'Harvest after neck fall and cure bulbs thoroughly before grading and storage.'],
  'Carrot': ['Choose a variety suited to season and market type; use fresh seed and a deep, stone-free, fine seedbed.', 'Keep the seed zone moist for uniform germination; avoid irregular watering that can cause root cracking.', 'Thin seedlings to suitable spacing and monitor leaf blights and root-knot nematodes where prevalent.', 'Harvest at the desired root size before over-maturity; remove tops and handle roots carefully.'],
  'Brinjal': ['Select varieties suited to local climate and fruit type; use healthy seedlings and appropriate spacing.', 'Maintain regular moisture and support healthy growth without waterlogging.', 'Scout for shoot and fruit borer, jassids, wilt and little-leaf symptoms; remove infested shoots and use integrated management.', 'Harvest tender, glossy fruits at market size and pick regularly.'],
  'Cabbage': ['Choose a variety for the season and head size; transplant healthy, hardened seedlings.', 'Maintain even moisture during head formation and ensure drainage after heavy rain.', 'Monitor diamondback moth, aphids, black rot and clubroot; use crop rotation and field sanitation.', 'Harvest firm, compact heads and remove damaged outer leaves before marketing.'],
  'Mango': ['Select a locally suitable cultivar and healthy grafted planting material; plan orchard spacing and pollination needs.', 'Manage young-tree irrigation and mulch; mature-tree water needs depend on rainfall, soil and flowering management.', 'Monitor hopper, fruit fly, powdery mildew and anthracnose; orchard sanitation and timely scouting are essential.', 'Harvest at physiological maturity for the target market; avoid bruising and use careful grading.'],
  'Banana': ['Choose a variety for dessert, cooking or processing and use disease-free tissue-culture plants or healthy suckers.', 'Maintain regular moisture and drainage; support plants and manage leaves and bunches as recommended.', 'Watch for rhizome weevil, pseudostem borer, sigatoka and wilt; use clean planting material and sanitation.', 'Harvest bunches at appropriate maturity for distance to market; protect fruit during transport.'],
  'Guava': ['Use healthy grafted or air-layered plants of a suitable cultivar; plan spacing, pruning and orchard layout.', 'Irrigate young plants regularly and manage moisture during flowering and fruit development; avoid waterlogging.', 'Monitor fruit fly, wilt, bark-eating caterpillar and anthracnose; collect fallen and infested fruits.', 'Harvest mature fruits carefully at the required firmness and grade quickly.'],
  'Papaya': ['Use true-to-type, healthy seed or seedlings and choose suitable varieties; ensure good drainage before planting.', 'Papaya is sensitive to waterlogging; provide steady moisture and support plants in windy locations.', 'Monitor papaya ringspot virus, mealybug, mites and root rot; rogue virus-infected plants and control vectors through approved methods.', 'Pick fruits at suitable colour break or maturity for local and distant markets.'],
  'Orange': ['Use certified budded plants of a locally recommended cultivar and rootstock; establish a well-drained orchard.', 'Manage irrigation according to tree age, soil and fruit development; avoid waterlogging and severe moisture swings.', 'Scout for citrus canker, greening symptoms, psylla, leaf miner and fruit fly; use disease-free planting material.', 'Harvest at suitable maturity and colour for the market; avoid pulling fruit and damaging branches.'],
  'Cotton': ['Choose a locally approved variety or hybrid suited to soil, rainfall and pest pressure; follow recommended plant spacing.', 'Conserve moisture and avoid excess nitrogen; irrigation timing should reflect crop stage and local conditions.', 'Monitor pink bollworm, whitefly, jassids and sucking pests; use refuge and resistance-management practices where applicable.', 'Pick fully opened clean kapas in several pickings and keep it dry and free from trash.'],
  'Sugarcane': ['Use healthy, disease-free setts or approved planting material and a variety suited to the local crushing season.', 'Ensure establishment moisture, timely irrigation and drainage; trash mulching and water-efficient methods may help.', 'Monitor early shoot borer, top borer, pyrilla, smut and red rot; use healthy seed cane and field sanitation.', 'Harvest at maturity and coordinate cutting and transport with the mill or buyer to reduce quality loss.'],
  'Jute': ['Choose a fibre type and variety suited to local rainfall and sowing window; prepare a fine seedbed.', 'Maintain moisture for establishment and avoid prolonged waterlogging in young plants.', 'Control early weeds and monitor stem rot, semilooper and other local pests.', 'Harvest at the recommended crop age for fibre quality; retting water quality and duration strongly affect fibre.'],
  'Tobacco': ['Tobacco is regulated and highly region-specific; only cultivate where legally permitted and follow official state and crop-board guidance.', 'Use approved varieties and transplanting practices only under local extension recommendations.', 'Monitor pests and diseases using integrated management; follow strict worker, residue and environmental safety requirements.', 'Harvest and cure only using approved local practices and comply with all applicable regulations.'],
  'Kenaf': ['Select a locally adapted fibre variety and sow in a warm, moist season with a well-prepared seedbed.', 'Maintain moisture during establishment and manage drainage after heavy rainfall.', 'Control early weeds and scout for leaf-eating insects and stem diseases.', 'Harvest at the locally recommended stage for the intended fibre quality and retting method.'],
  'Groundnut': ['Select a variety suited to season and soil; use bold, healthy seed and avoid damaged kernels.', 'Maintain moisture during pegging and pod development; avoid waterlogging and compacted soil.', 'Monitor leaf spot, rust, stem rot, white grubs and aphids; rotate crops and use clean seed.', 'Harvest when pods mature, dry plants and pods thoroughly and store at safe moisture.'],
  'Sunflower': ['Choose a locally recommended hybrid or variety and sow at the suitable season for uniform flowering.', 'Avoid water stress at bud formation, flowering and seed filling; ensure drainage.', 'Monitor head borer, capitulum rot, necrosis and birds; scout regularly and use integrated methods.', 'Harvest when the back of the head turns yellow-brown and seeds mature; dry heads before threshing.'],
  'Mustard': ['Select a suitable mustard or rapeseed variety and sow within the recommended Rabi window.', 'Conserve soil moisture and provide irrigation at locally critical stages if available; avoid waterlogging.', 'Monitor aphids, alternaria blight, white rust and sawfly; use resistant varieties and field scouting.', 'Harvest when siliquae turn yellow and seeds mature; avoid delay to reduce shattering.'],
  'Soybean': ['Use certified seed of a locally recommended variety and inoculant only as advised; sow with monsoon onset and suitable soil moisture.', 'Avoid waterlogging and moisture stress during flowering and pod filling.', 'Monitor yellow mosaic, girdle beetle, stem fly, pod borer and rust; rotate crops and scout regularly.', 'Harvest when most leaves have fallen and pods are mature; thresh promptly to reduce field losses.'],
  'Sesame': ['Choose a variety suited to rainfall and season; prepare a fine seedbed because sesame seed is small.', 'Avoid waterlogging and maintain moisture during establishment, flowering and capsule formation.', 'Monitor phyllody, root rot, leaf webber and capsule borer; remove affected plants where advised.', 'Harvest when lower capsules begin changing colour; cut and stack carefully to reduce seed shattering.'],
  'Turmeric': ['Use healthy, disease-free rhizomes of a recommended variety; prepare raised beds or ridges with organic matter.', 'Maintain moist but well-drained soil; mulch and ensure drainage during monsoon.', 'Monitor rhizome rot, leaf blotch, shoot borer and nematodes; use healthy rhizomes and field sanitation.', 'Harvest when leaves yellow and dry; cure, dry and polish rhizomes according to market requirements.'],
  'Ginger': ['Select firm, disease-free seed rhizomes and plant in well-drained beds enriched with organic matter.', 'Keep beds moist with mulch but prevent stagnant water, especially during rainy periods.', 'Watch for soft rot, bacterial wilt, shoot borer and leaf spot; clean seed and drainage are critical.', 'Harvest at maturity according to fresh or dry ginger market needs; wash and cure carefully.'],
  'Chilli': ['Select a variety for fresh green or dry red chilli and use healthy seedlings; match planting season to local climate.', 'Maintain even moisture during flowering and fruit development; avoid waterlogging.', 'Monitor thrips, mites, fruit borer, leaf curl and anthracnose; use healthy seedlings and integrated pest management.', 'Pick mature green or red fruits according to market purpose; dry red chilli on clean surfaces.'],
  'Black Pepper': ['Plant healthy rooted cuttings of recommended cultivars near suitable live standards or support systems.', 'Provide partial shade, organic mulch and moisture while ensuring excellent drainage.', 'Monitor quick wilt, slow decline, pollu beetle and scale insects; sanitation and drainage are important.', 'Harvest spikes when berries reach the locally appropriate maturity for black or white pepper processing.'],
  'Cardamom': ['Use disease-free planting material of a suitable type and establish under appropriate shade and humid conditions.', 'Maintain shade, mulch and moisture while preventing water stagnation around clumps.', 'Scout for thrips, shoot and capsule borers, katte disease and capsule rot; remove diseased clumps as advised.', 'Pick capsules at suitable maturity in multiple rounds and dry carefully to preserve colour and aroma.'],
  'Rose': ['Choose varieties for cut flowers, loose flowers or garden use; use healthy planting material and suitable spacing.', 'Maintain even moisture and prune according to variety and production system; avoid wet foliage where disease-prone.', 'Monitor mites, thrips, aphids, black spot and powdery mildew; maintain sanitation and airflow.', 'Harvest at the right bud stage for the market and hydrate or cool flowers promptly.'],
  'Jasmine': ['Select a locally suitable species and healthy rooted cuttings; prepare a sunny, well-drained planting site.', 'Irrigate according to soil and season; prune after flowering flushes as locally recommended.', 'Monitor budworm, blossom midge, leaf webber and wilt; remove damaged buds and maintain sanitation.', 'Pick mature buds during cool hours and move quickly to market to preserve freshness.'],
  'Marigold': ['Choose African or French types and varieties suited to loose flowers, garlands or extraction; transplant healthy seedlings.', 'Pinch and space plants as recommended to encourage branching; maintain moisture without waterlogging.', 'Scout for aphids, thrips, leaf spot and bud rot; use clean seedlings and field sanitation.', 'Harvest fully developed flowers at the desired stage and handle gently to avoid bruising.'],
  'Chrysanthemum': ['Choose varieties for cut or loose flowers and match planting date to flowering season and photoperiod response.', 'Use well-drained beds, pinching and staking where needed; maintain moisture during bud development.', 'Monitor aphids, mites, leaf miner, rust and wilt; remove infected material and maintain airflow.', 'Harvest at the appropriate flower opening stage and keep stems hydrated after cutting.']
}

const stagesByCategory = {
  'Cereals & Millets': ['Seed and field preparation', 'Establishment and early weed control', 'Vegetative growth and nutrient management', 'Flowering and grain formation', 'Maturity, harvest and storage'],
  'Pulses': ['Seed selection and inoculation if recommended', 'Sowing and seedling establishment', 'Branching and flowering', 'Pod formation and filling', 'Timely picking, drying and storage'],
  'Vegetables': ['Nursery or direct sowing', 'Transplanting and establishment', 'Vegetative growth and support', 'Flowering and fruit or head development', 'Repeated harvest and grading'],
  'Fruits': ['Site and orchard establishment', 'Young plant establishment', 'Canopy, nutrition and water management', 'Flowering, fruit set and fruit development', 'Harvest, grading and orchard sanitation'],
  'Commercial & Fibre Crops': ['Planting material and field preparation', 'Establishment and gap filling', 'Vegetative growth and interculture', 'Economic produce development', 'Harvest, processing and sale'],
  'Oilseeds': ['Seed treatment and sowing', 'Establishment and weed control', 'Branching and flowering', 'Pod, capsule or seed filling', 'Harvest and safe drying'],
  'Spices & Plantation Crops': ['Healthy rhizome or planting material selection', 'Bed or orchard establishment', 'Shade, mulch and moisture management', 'Rhizome, berry or capsule development', 'Harvest, curing and storage'],
  'Flowers': ['Planting material and bed preparation', 'Establishment and pinching', 'Branching and bud initiation', 'Flower development', 'Harvest, grading and quick marketing']
}

const crops = rawCrops.map(([name, category, image, emoji, season, duration, regions], index) => ({
  id: `${category}-${name}`, name, category, image, emoji, season, duration, regions,
  ...categoryInfo[category], idNumber: index + 1
}))

const categories = Object.keys(categoryInfo)

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

function cropSections(crop) {
  const notes = cropNotes[crop.name] || [
    `Select planting material and a variety recommended by the local agricultural university or KVK for ${crop.name.toLowerCase()} in your district.`,
    `Match field preparation, spacing and planting time to the selected variety, soil test and local season.`,
    `Scout regularly for crop-specific weeds, pests and diseases; use integrated management and confirm diagnosis before treatment.`,
    `Harvest at the maturity stage recommended for the intended market and dry or handle produce safely.`
  ]
  return [
    { title: 'Crop overview & suitability', icon: '🌱', points: [`${crop.name} belongs to ${crop.category.toLowerCase()}. Its growing season is listed as ${crop.season.toLowerCase()}.`, `Major growing regions in this reference: ${crop.regions}. District-level suitability can differ within a state.`, `Approximate duration: ${crop.duration}. Actual duration depends on variety, planting date, weather and management.`] },
    { title: 'Land preparation & soil', icon: '🪴', points: [crop.soil, 'Test soil before planting where possible: check pH, organic carbon and available nutrients through a recognised soil testing laboratory.', 'Prepare a level or raised field according to the crop and drainage requirement. Incorporate well-decomposed organic matter based on local advice; avoid fresh manure in direct contact with seed or roots.'] },
    { title: 'Seed, variety & sowing', icon: '🌾', points: [notes[0], 'Buy certified or otherwise quality-assured seed/planting material from a reliable source. Check variety name, lot details, germination and seed health.', 'Follow the locally recommended seed rate, spacing, sowing depth, seed treatment and planting window. These values vary by variety and production system; do not use a generic dose.'] },
    { title: 'Growth-stage management', icon: '📈', points: [notes[1], 'Early establishment: check germination, plant population, gaps, weeds and early pest symptoms; correct problems while the crop is young.', 'Reproductive stage: monitor flowering, fruit/pod/grain formation and moisture stress closely. Avoid operations that damage flowers or developing produce.', 'Maturity: reduce avoidable stress, plan labour and equipment, and arrange a clean drying and storage area before harvest.'] },
    { title: 'Irrigation & water management', icon: '💧', points: [crop.water, 'Check soil moisture at root depth rather than relying only on a fixed calendar. Adjust irrigation for soil texture, rainfall, crop stage and forecast.', 'Use field channels, drip or sprinkler systems where suitable. Repair leaks, prevent runoff and ensure drainage after heavy rain.'] },
    { title: 'Nutrient & soil-health management', icon: '🧪', points: ['Base fertiliser quantities on a soil test, crop recommendation, target yield and nutrient already supplied through manure or previous crops.', 'Nitrogen supports vegetative growth; phosphorus supports roots and energy transfer; potassium supports water regulation and produce quality. Timing and balance matter.', 'Use compost or well-decomposed farmyard manure where suitable, rotate crops and avoid excess fertiliser. Split applications should follow local crop recommendations.'] },
    { title: 'Weed, pest & disease protection', icon: '🛡️', points: [notes[2], 'Inspect the field at least weekly and more often during high-risk weather. Record symptoms, affected area and crop stage; compare healthy and affected plants.', 'Use integrated pest management: resistant varieties, clean seed, crop rotation, field sanitation, traps or biological controls where recommended, and conservation of beneficial insects.', 'Do not spray based only on a photo or guess. Confirm the pest or disease and use only locally registered products at label rates with protective equipment and pre-harvest intervals.'] },
    { title: 'Harvest, post-harvest & marketing', icon: '🚜', points: [notes[3], 'Harvest at the right maturity for the intended use and market distance. Handle produce gently and separate damaged or diseased material.', 'Dry, cure, grade and store as appropriate for the crop. Keep storage clean, dry, ventilated and protected from pests; monitor moisture and quality.', 'Check local mandi prices, buyer quality standards, transport costs and market timing before dispatch. Keep records of quantity, grade, sale price and expenses.'] },
    { title: 'Farmer field checklist', icon: '📋', points: ['Before planting: soil test, variety selection, seed source, field drainage, labour and market plan.', 'During crop growth: maintain a field diary, monitor rainfall and soil moisture, scout pests and record all input applications.', 'Before harvest: confirm maturity, arrange labour and transport, prepare drying/storage space and compare buyer prices.'] }
  ]
}

function openCropPdf(crop, budget) {
  const sections = cropSections(crop)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 17
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const colors = {
    green: [32, 112, 66],
    dark: [38, 52, 69],
    muted: [96, 113, 132],
    line: [218, 229, 222],
    pale: [244, 248, 245],
    white: [255, 255, 255]
  }

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 19) {
      doc.addPage()
      y = 19
    }
  }

  const addWrappedText = (text, x, maxWidth, fontSize, options = {}) => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(...(options.color || colors.dark))
    const lines = doc.splitTextToSize(String(text), maxWidth)
    const lineHeight = options.lineHeight || fontSize * 0.48
    const height = lines.length * lineHeight
    ensureSpace(height + (options.after || 0))
    doc.text(lines, x, y)
    y += height + (options.after || 0)
    return height
  }

  const addSectionHeading = (text) => {
    const lines = doc.splitTextToSize(text, contentWidth - 2)
    const height = lines.length * 7 + 7
    ensureSpace(height + 5)
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...colors.green)
    doc.text(lines, margin, y)
    y += lines.length * 6
    doc.setDrawColor(...colors.line)
    doc.setLineWidth(0.35)
    doc.line(margin, y + 1, pageWidth - margin, y + 1)
    y += 7
  }

  // Report title block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...colors.green)
  doc.text('FARMER KNOWLEDGE CENTRE', margin, y)
  y += 9

  doc.setFontSize(23)
  doc.setTextColor(...colors.green)
  doc.text('AgroVision AI', margin, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...colors.dark)
  doc.text('Crop Cultivation Report', margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colors.muted)
  doc.text(
    `Crop-specific field handbook | Generated: ${new Date().toLocaleDateString('en-IN')}`,
    margin,
    y
  )
  y += 5
  doc.setDrawColor(...colors.green)
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageWidth - margin, y)
  y += 9

  // Crop overview
  addSectionHeading(`Crop Overview: ${crop.name}`)
  const overviewItems = [
    ['Category', crop.category],
    ['Growing season', crop.season],
    ['Approximate duration', crop.duration],
    ['Major growing regions', crop.regions]
  ]

  overviewItems.forEach(([label, value]) => {
    const labelText = `${label}: `
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const labelWidth = doc.getTextWidth(labelText)
    doc.setFont('helvetica', 'normal')
    const valueLines = doc.splitTextToSize(String(value), contentWidth - labelWidth)
    const rowHeight = Math.max(5, valueLines.length * 5)
    ensureSpace(rowHeight + 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...colors.dark)
    doc.text(labelText, margin + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.text(valueLines, margin + 2 + labelWidth, y)
    y += rowHeight + 2
  })

  // Crop profile table, with wrapped cells and repeated header on a new page.
  y += 4
  ensureSpace(35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...colors.muted)
  doc.text('CROP PROFILE', margin, y)
  y += 5

  const columns = [
    { title: 'Crop', value: crop.name, width: 25 },
    { title: 'Season', value: crop.season, width: 43 },
    { title: 'Duration', value: crop.duration, width: 30 },
    { title: 'Growing regions', value: crop.regions, width: contentWidth - 98 }
  ]
  const drawTableHeader = () => {
    doc.setFillColor(...colors.green)
    doc.rect(margin, y, contentWidth, 9, 'F')
    let x = margin
    columns.forEach(column => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...colors.white)
      doc.text(column.title, x + 2, y + 6)
      x += column.width
    })
    y += 9
  }
  drawTableHeader()

  const cellLines = columns.map(column => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    return doc.splitTextToSize(String(column.value), column.width - 4)
  })
  const rowHeight = Math.max(12, ...cellLines.map(lines => lines.length * 4 + 5))
  ensureSpace(rowHeight + 2)
  if (y + rowHeight > pageHeight - 19) {
    doc.addPage()
    y = 19
    drawTableHeader()
  }
  doc.setFillColor(...colors.pale)
  doc.rect(margin, y, contentWidth, rowHeight, 'F')
  let x = margin
  columns.forEach((column, index) => {
    doc.setDrawColor(...colors.line)
    doc.rect(x, y, column.width, rowHeight)
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.dark)
    doc.text(cellLines[index], x + 2, y + 5)
    x += column.width
  })
  y += rowHeight + 7

  // Full crop guidance: all sections and all bullet points are retained.
  sections.forEach(section => {
    addSectionHeading(section.title)
    section.points.forEach(point => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      const bulletText = doc.splitTextToSize(`- ${point}`, contentWidth - 5)
      const lineHeight = 4.8
      const blockHeight = bulletText.length * lineHeight + 3
      ensureSpace(blockHeight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...colors.dark)
      doc.text(bulletText, margin + 2, y)
      y += blockHeight
    })
    y += 2
  })

  // Farm Budget Estimate: values entered by the user
  addSectionHeading('Farm Budget Estimate')
  addWrappedText(
    'Personalised cultivation budget based on the figures entered in the Farmer Tools estimator. These are planning estimates, not guaranteed returns.',
    margin,
    contentWidth,
    9,
    { color: colors.muted, lineHeight: 4.5, after: 4 }
  )

  const formatBudgetInput = value =>
    value === '' || value === null || value === undefined
      ? 'Not entered'
      : Number(value).toLocaleString('en-IN')

  const formatBudgetAmount = value =>
    `INR ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

  const budgetRows = [
    ['Land size', `${formatBudgetInput(budget.acres)} acres`],
    ['Estimated expense per acre', formatBudgetAmount(budget.expenses)],
    ['Expected yield per acre', `${formatBudgetInput(budget.yieldPerAcre)} units`],
    ['Expected selling price per unit', formatBudgetAmount(budget.pricePerUnit)],
    ['Total estimated cost', formatBudgetAmount(budget.totalCost)],
    ['Estimated production', `${Number(budget.production || 0).toLocaleString('en-IN')} units`],
    ['Estimated revenue', formatBudgetAmount(budget.revenue)],
    ['Estimated surplus / deficit', formatBudgetAmount(budget.profit)]
  ]

  budgetRows.forEach(([label, value]) => {
    addWrappedText(`${label}: ${value}`, margin + 2, contentWidth - 4, 9.5, {
      after: 3,
      bold: label === 'Total estimated cost' ||
            label === 'Estimated revenue' ||
            label === 'Estimated surplus / deficit',
      color: label === 'Estimated surplus / deficit'
        ? (Number(budget.profit) >= 0 ? colors.green : [190, 65, 55])
        : colors.dark
    })
  })

  addWrappedText(
    'Note: Results depend on the accuracy of the entered land, expense, yield and selling-price figures. Actual production and market prices may vary. This estimate excludes costs not included in the expense input.',
    margin,
    contentWidth,
    8.5,
    { color: colors.muted, lineHeight: 4.4, after: 5 }
  )
  // Disclaimer and footer
  y += 3
  addSectionHeading('Important Disclaimer')
  addWrappedText(
    'This report is an educational reference. Confirm variety-specific seed rate, spacing, fertiliser dose, irrigation schedule and plant-protection measures with your State Agricultural University, Krishi Vigyan Kendra (KVK) or agriculture department. Local soil, weather and crop stage can change recommendations. Use only registered products according to their labels.',
    margin,
    contentWidth,
    8.5,
    { color: colors.muted, lineHeight: 4.4, after: 4 }
  )
  addWrappedText(
    `Prepared by AgroVision AI | Crop-specific report for ${crop.name}`,
    margin,
    contentWidth,
    8,
    { color: colors.muted }
  )

  // Add page numbers to every page.
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(...colors.line)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.muted)
    doc.text('AgroVision AI | Crop Cultivation Report', margin, pageHeight - 8)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  doc.save('agrovision.report.pdf')
}

export default function AgricultureHub() {
  const [activeCategory, setActiveCategory] = useState('Cereals & Millets')
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [acres, setAcres] = useState('1')
  const [expenses, setExpenses] = useState('')
  const [yieldPerAcre, setYieldPerAcre] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  // Search across every crop category automatically
  const handleSearchChange = value => {
    const term = value.trim().toLowerCase()
    setSearch(value)

    if (!term) return

    const categoryMatch = categories.find(category =>
      category.toLowerCase().includes(term) ||
      term.includes(category.toLowerCase())
    )

    if (categoryMatch) {
      setActiveCategory(categoryMatch)
      return
    }

    const cropMatch = crops.find(crop =>
      crop.name.toLowerCase().includes(term) ||
      crop.regions.toLowerCase().includes(term)
    )

    if (cropMatch) {
      setActiveCategory(cropMatch.category)
    }
  }

  const filteredCrops = useMemo(() => {
    const term = search.trim().toLowerCase()

    const isCategorySearch = categories.some(category =>
      category.toLowerCase().includes(term) ||
      term.includes(category.toLowerCase())
    )

    return crops.filter(crop =>
      crop.category === activeCategory &&
      (!term || isCategorySearch ||
        crop.name.toLowerCase().includes(term) ||
        crop.regions.toLowerCase().includes(term))
    )
  }, [activeCategory, search])

  const sections = selectedCrop ? cropSections(selectedCrop) : []
  const tabs = ['Overview', 'Cultivation', 'Water & Nutrition', 'Crop Protection', 'Harvest', 'Farmer Tools']
  const totalCost = Math.max(0, Number(acres) || 0) * Math.max(0, Number(expenses) || 0)
  const production = Math.max(0, Number(acres) || 0) * Math.max(0, Number(yieldPerAcre) || 0)
  const revenue = production * Math.max(0, Number(pricePerUnit) || 0)
  const profit = revenue - totalCost

  const tabSections = {
    'Overview': sections.slice(0, 2),
    'Cultivation': sections.slice(2, 4),
    'Water & Nutrition': sections.slice(4, 6),
    'Crop Protection': sections.slice(6, 7),
    'Harvest': sections.slice(7, 9)
  }

  return (
    <section id="explore" className="section agriculture-section">
      <div className="section-heading">
        <div><h2 className="agri-marquee-title">
  <img
    className="agri-title-tractor"
    src="/images/agrovision-tractor.jpg"
    alt="Green tractor working in a farm field"
  />
  <span>EXPLORE AGRICULTURE</span>
</h2></div>
        <p>Practical crop knowledge and planning tools for farmers.</p>
      </div>

      <div className="agri-intro">
        <span>🌱</span><div><p>Discover {rawCrops.length} crops, explore cultivation practices and find the right farming guide.</p></div>
      </div>

      <div className="agri-search">
        <span>🔎</span><input type="search" value={search} onChange={event => handleSearchChange(event.target.value)}
          placeholder="Search any crop or category (e.g. Tomato, Apple, Rice)..." aria-label="Search crops across all categories" />
        {search && <button type="button" onClick={() => setSearch('')}>Clear</button>}
      </div>

      <div className="agri-filters" aria-label="Crop categories">
        {categories.map(category => (
          <button key={category} type="button" className={activeCategory === category ? 'active' : ''}
            onClick={() => { setActiveCategory(category); setSearch('') }}>
            {categoryInfo[category].icon} {category}
          </button>
        ))}
      </div>

      <div className="agri-results"><p>Showing <strong>{filteredCrops.length}</strong> crops in {activeCategory}</p></div>

      <div className="agri-grid">
        {filteredCrops.map(crop => (
          <button className="agri-card" type="button" key={crop.id} onClick={() => { setSelectedCrop(crop); setActiveTab('Overview') }}>
            {crop.image ? <img src={`/images/${crop.image}`} alt={`${crop.name} crop`} loading="lazy" /> :
              <div className="agri-placeholder" aria-hidden="true"><span>{crop.emoji}</span></div>}
            <div className="agri-card-content"><span className="agri-card-category">{crop.category}</span><h3>{crop.name}</h3>
              <p>Growing season: {crop.season}</p><span className="agri-card-link">Open farmer guide ↗</span></div>
          </button>
        ))}
      </div>

      {filteredCrops.length === 0 && <div className="agri-empty"><span>🔎</span><h3>No crops found in this category</h3>
        <p>Try another crop name or clear your search.</p><button type="button" onClick={() => setSearch('')}>Clear search</button></div>}

      {selectedCrop && createPortal(<div className="agri-modal-backdrop" onClick={() => setSelectedCrop(null)}>
        <article className="agri-modal agri-modal-premium agri-handbook-modal" role="dialog" aria-modal="true"
          aria-labelledby="agri-modal-title" onClick={event => event.stopPropagation()}>
          <button type="button" className="agri-modal-close" aria-label="Close crop details" onClick={() => setSelectedCrop(null)}>×</button>
          <div className="agri-modal-hero">
            {selectedCrop.image && <img className="agri-modal-hero-image" src={`/images/${selectedCrop.image}`} alt="" />}
            <div className="agri-modal-hero-shade" />
            <div className="agri-modal-hero-copy"><span className="agri-modal-kicker">{categoryInfo[selectedCrop.category]?.icon} {selectedCrop.category}</span>
              <h2 id="agri-modal-title">{selectedCrop.name}</h2>
              <p>A practical cultivation reference covering crop establishment, growth-stage care, protection, harvest and farm planning.</p></div>
            <span className="agri-modal-location">📍 India · Crop-specific cultivation guide</span>
          </div>

          <div className="agri-modal-content agri-modal-premium-content">
            <div className="agri-handbook-topline"><div><span className="agri-modal-overline">CROP-SPECIFIC FIELD HANDBOOK</span>
              <h3>Plan, grow and manage {selectedCrop.name}</h3></div>
              <button type="button" className="agri-pdf-button" onClick={() => openCropPdf(selectedCrop, { acres, expenses, yieldPerAcre, pricePerUnit, totalCost, production, revenue, profit })}>📄 Download crop PDF</button>
            </div>

            <div className="agri-detail-grid agri-detail-grid-premium">
              <div><span>🌱 Growing season</span><strong>{selectedCrop.season}</strong></div>
              <div><span>⏳ Approximate duration</span><strong>{selectedCrop.duration}</strong></div>
              <div><span>🪴 Soil guidance</span><strong>{selectedCrop.soil}</strong></div>
              <div><span>🌤️ Climate</span><strong>{selectedCrop.climate}</strong></div>
              <div><span>💧 Water</span><strong>{selectedCrop.water}</strong></div>
              <div><span>📍 Major growing states</span><strong>{selectedCrop.regions}</strong></div>
            </div>

            <div className="agri-handbook-tabs" role="tablist" aria-label="Crop handbook sections">
              {tabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>

            {activeTab === 'Farmer Tools' ? <div className="agri-farmer-tools">
              <div className="agri-tool-card"><span className="agri-modal-overline">FARM BUDGET ESTIMATOR</span><h4>Estimate your cultivation economics</h4>
                <p>Enter your own local figures. This is a planning estimate, not a guaranteed yield or market return.</p>
                <div className="agri-tool-inputs">
                  <label>Land size (acres)<input type="number" min="0" step="0.1" value={acres} onChange={e => setAcres(e.target.value)} /></label>
                  <label>Estimated expense per acre (₹)<input type="number" min="0" value={expenses} onChange={e => setExpenses(e.target.value)} /></label>
                  <label>Expected yield per acre (quintals / units)<input type="number" min="0" step="0.1" value={yieldPerAcre} onChange={e => setYieldPerAcre(e.target.value)} /></label>
                  <label>Expected selling price per quintal / unit (₹)<input type="number" min="0" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} /></label>
                </div>
                <div className="agri-estimate-results">
                  <div><span>Total estimated cost</span><strong>₹{totalCost.toLocaleString('en-IN')}</strong></div>
                  <div><span>Estimated production</span><strong>{production.toLocaleString('en-IN')} units</strong></div>
                  <div><span>Estimated revenue</span><strong>₹{revenue.toLocaleString('en-IN')}</strong></div>
                  <div><span>Estimated surplus / deficit</span><strong className={profit >= 0 ? 'positive' : 'negative'}>₹{profit.toLocaleString('en-IN')}</strong></div>
                </div>
                <small>Enter matching units for yield and price. Excludes finance costs, family labour, land rent and unforeseen losses unless included in your expense input.</small>
              </div>
              <div className="agri-tool-card"><span className="agri-modal-overline">FIELD PLANNING</span><h4>Before you start this crop</h4>
                <ul><li>Confirm local variety and sowing window with your KVK or State Agricultural University.</li><li>Get a soil test and plan seed, water, labour and input availability.</li><li>Check nearby market demand, expected harvest period and transport options.</li><li>Maintain a record of dates, inputs, labour, field observations and sales.</li></ul>
              </div>
              <div className="agri-tool-card"><span className="agri-modal-overline">GROWTH-STAGE ROADMAP</span><h4>Typical management sequence</h4>
                <ol>{(stagesByCategory[selectedCrop.category] || []).map(stage => <li key={stage}>{stage}</li>)}</ol>
                <small>Stage sequence is a planning aid. Timing and operations vary by variety, region and production method.</small>
              </div>
            </div> : <div className="agri-handbook-sections">
              {(tabSections[activeTab] || []).map(section => <section className="agri-handbook-section" key={section.title}>
                <div className="agri-handbook-section-title"><span>{section.icon}</span><h4>{section.title}</h4></div>
                <ul>{section.points.map((point, index) => <li key={index}>{point}</li>)}</ul>
              </section>)}
              {activeTab === 'Overview' && <div className="agri-guidance agri-guidance-premium"><div className="agri-guidance-heading"><span>🧭</span><div>
                <span className="agri-modal-overline">LOCAL DECISION MATTERS</span><h3>Before following this guide</h3></div></div>
                <p>Confirm the crop variety, soil suitability and sowing window for your own district. The same crop may need different management under irrigated, rainfed, upland or protected cultivation.</p></div>}
            </div>}

            <p className="agri-modal-note">Agricultural guidance is for education and planning. Exact seed rates, fertiliser doses, irrigation schedules and plant-protection treatments must be checked against current local recommendations for the crop variety and district. For diagnosis or pesticide use, consult your KVK or agriculture department.</p>
            <button type="button" className="agri-modal-done agri-modal-done-premium" onClick={() => setSelectedCrop(null)}>Close crop handbook</button>
          </div>
        </article>
      </div>, document.body)}
    </section>
  )
}
