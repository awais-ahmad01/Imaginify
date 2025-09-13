"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from "@/constants";
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,

} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { CustomField } from "./CustomField";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import MediaUploader from "./MediaUploader";
import TransformedImage from "./TransformedImage";
import { updateCredits } from "@/lib/database/actions/user.action";
import { getCldImageUrl } from "next-cloudinary";
import { addImage, updateImage } from "@/lib/database/actions/image.actions";
import { InsufficientCreditsModal } from "./InsufficientCreditsModal";

export const formSchema = z.object({
  title: z.string(),
  aspectRatio: z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
});


const TransformationForm = ({
  action,
  data = null,
  type,
  userId,
  creditBalance,
  config=null
}: TransformationFormProps) => {
  
    const transformationType = transformationTypes[type];
    
    const [Image, setImage] = useState(data);
    const [newTransformations, setNewTransformations] = 
    useState<Transformations | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransforming, setIsTransforming] = useState(false);
    const [transformationConfig, setTransformationConfig] = 
    useState(config);

    const [isPending, startTransition] = useTransition();

    const router = useRouter()

  const initialValues =
    data && action === "Update"
      ? {
          title: data?.title,
          aspectRatio: data?.aspectRatio,
          color: data?.color,
          prompt: data?.prompt,
          publicId: data?.publicId,
        }
      : defaultValues;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

    async function onSubmit(values: z.infer<typeof formSchema>) {

    setIsSubmitting(true);

    console.log('values:', values);

    console.log('Imageee:', Image);

      console.log('Data:', data);

    if(data || Image) {
      console.log('Getting transformationURL:')
      const transformationUrl = getCldImageUrl({
        width: Image?.width,
        height: Image?.height,
        src: Image?.publicId,
        ...transformationConfig
      })

      console.log('transformationURL:', transformationUrl)

      const imageData = {
        title: values.title,
        publicId: Image?.publicId,
        transformationType: type,
        width: Image?.width,
        height: Image?.height,
        config: transformationConfig,
        secureURL: Image?.secureUrl,
        transformationURL: transformationUrl,
        aspectRatio: values.aspectRatio,
        prompt: values.prompt,
        color: values.color,
      }

      console.log("imageData:", imageData)

      if(action === 'Add') {
        try {
          console.log("Add Action:")
          const newImage = await addImage({
            image: imageData,
            userId,
            path: '/'
          })
          console.log("new Image: ", newImage)

          if(newImage) {
            form.reset()
            setImage(data)
            router.push(`/transformations/${newImage._id}`)
          }
        } catch (error) {
          console.log(error);
        }
      }

      if(action === 'Update') {
        try {
          const updatedImage = await updateImage({
            image: {
              ...imageData,
              _id: data._id
            },
            userId,
            path: `/transformations/${data._id}`
          })

          console.log("updated Image", updatedImage)

          if(updatedImage) {
            router.push(`/transformations/${updatedImage._id}`)
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

    setIsSubmitting(false)
  }

  const onSelectFileHandler = (value: string,
    onChangeField: (value: string) => void
  ) =>{
    const imageSize = aspectRatioOptions[value as AspectRatioKey];

    setImage((prev:any) => ({
      ...prev,
      aspectRatio: imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
    }));

    setNewTransformations(transformationType.config);

    return onChangeField(value);
  }


  const onInputChangeHandler = (fieldName:string, value: string, type: string,
    onChangeField: (value: string) => void
  ) =>{
    debounce(() => {
        setNewTransformations((prev: any) => ({
            ...prev,
            [type]: {
                ...prev?.[type],
                [fieldName === "prompt" ? "prompt": "to"]: value,
            },
        }));

        
    }, 1000)();

    return onChangeField(value);
  }


  const onTransformHandler = () =>{

    setIsTransforming(true);

    console.log("Transformation Handler")

    setTransformationConfig(
        deepMergeObjects(newTransformations, transformationConfig)
    )


    setNewTransformations(null);

    startTransition(async () =>{
        console.log("update credits:")
        await updateCredits(userId, creditFee);
    });
  }


  useEffect(()=>{
    if(Image && (type === 'restore' || type === 'removeBackground')){
      setNewTransformations(transformationType.config);
    }
  }, [Image, transformationType.config, type])


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal/>}
        <CustomField
          control={form.control}
          name="title"
          formLabel="Image Title"
          className="w-full"
          render={({ field }) => <Input {...field} />}
          // className="input-field"
        />

        {type === "fill" && (
          <CustomField
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({ field }) => (
              <Select
                onValueChange={(value)=> onSelectFileHandler(value, field.onChange)}
              >

                <SelectTrigger className="select-field">
                  <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(aspectRatioOptions).map((key)=>(
                    <SelectItem key={key} value={key}>
                        {aspectRatioOptions[key as AspectRatioKey].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}


        {(type === "remove" || type === "recolor") && (
            <div className="prompt-field">
                <CustomField 
                control={form.control}
                name="prompt"
                formLabel={
                    type === "remove" ? "Object to remove" : "Object to recolor"
                }
                className="w-full"
                render={({ field }) => (
                    <Input 
                        value={field.value}
                        className="input-field"
                        onChange={(e) => onInputChangeHandler("prompt", e.target.value, type, field.onChange)}
                />
                )}
                />

                {type === "recolor" && (
                    <CustomField 
                    control={form.control}
                    name="color"
                    formLabel="Replacement Color"
                    className="w-full"
                    render={({ field }) => (
                        <Input
                            value={field.value}
                            className="input-field"
                            onChange={(e) => onInputChangeHandler("color", e.target.value, "recolor", field.onChange)}
                        />
                    )}
                    />
                )}
            
    
            </div>
        )}


        <div className="media-uploader-field">
          <CustomField
          control={form.control}
          name="publicId"
          className="flex size-full flex-col"
          render={({ field }) => (
            <MediaUploader
              onValueChange={field.onChange}
              publicId={field.value}
              setImage={setImage}
              image={Image}
              type={type}
            />
          )}
        />

        <TransformedImage
          image={Image}
          type={type}
          title={form.getValues("title")}
          isTransforming={isTransforming}
          setIsTransforming={setIsTransforming}
          transformationConfig={transformationConfig}
        />
        </div>

       <div className="flex flex-col gap-4">
             <Button 
                type="button" 
                className="submit-button capitalize"
            disabled={isTransforming || newTransformations===null}
            onClick={onTransformHandler}
            >
            {isTransforming ? 'Transforming...' : 'Apply Transformation'}
        </Button> 

         <Button type="submit" className="submit-button capitalize"
        disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Image '}
        </Button>
       </div>
      </form>
    </Form>
  );
};

export default TransformationForm;
