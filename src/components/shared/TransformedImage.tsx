import { dataUrl, debounce, getImageSize } from "@/lib/utils";
import { CldImage } from "next-cloudinary";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import React from "react";
import { fa, is } from "zod/v4/locales";

export const TransformedImage = ({
  image,
  type,
  title,
  isTransforming,
  setIsTransforming,
  transformationConfig,
  hasDownload = false,
}: TransformedImageProps) => {
  const downloadHandler = () => {};

  console.log("Imageeeee:", image)
  console.log("TC:", transformationConfig)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-between">
        <h3 className="h3-bold text-dark-600">Transformed</h3>

        {hasDownload && (
          <button className="download-btn" onClick={downloadHandler}>
            <Image
              src="/assets/icons/download.svg"
              alt="Download"
              width={24}
              height={24}
              className="pb-[6px]"
            />
          </button>
        )}
      </div>

      {image?.publicId && transformationConfig ? (
        <div className="relative">
         
          <CldImage
            width={getImageSize(image, type, "width")}
            height={getImageSize(image, type, "height")}
            src={image?.publicId}
            alt='transformed Image'
            sizes={"(max-width: 767px) 100vw, 50vw"}
            placeholder={dataUrl as PlaceholderValue}
            className="transformed-image"
            onLoad={() => {
              isTransforming && setIsTransforming(false);
            }}
            onError={() => {
              debounce(() => {
                isTransforming && setIsTransforming(false);
              }, 8000);
            }}
            {...transformationConfig}
          />

            {isTransforming && (
                <div className="transformation-loader">
                    <Image
                        src="/assets/icons/spinner.svg"
                        alt="Transforming"
                        width={50}
                        height={50}
                    />
                    <p className="text-white/80">Please wait...</p>
                </div>
            )}
        </div>
      ) : (
        <div className="transformed-placeholder">Transformed Image</div>
      )}
    </div>
  );
};


export default TransformedImage;
