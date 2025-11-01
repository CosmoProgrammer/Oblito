import { getProductById } from '@/app/data/products'; // Adjust path if needed
import { notFound } from 'next/navigation';
import { CarouselDemo} from './Carousel';
import { ProductInteractions } from './ProductInteractions';

export default async function ProductPage({params}: any) {
  
    const {id} = await params;  
    const product =  getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div>
    <div className="max-w-7xl mx-auto px-5 py-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
      
  <div className="w-full lg:col-span-7">
    <CarouselDemo />
  </div>
      {/* RIGHT: PRODUCT INFO SECTION */}
      <div className="flex flex-col justify-start space-y-8 lg:col-span-5">
        {/* Product Title & Category */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        </div>
        {/* Product Interactions */}
        <ProductInteractions product={product} />
      </div>
    </div>
    </div>
  );
}

