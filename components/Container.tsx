import { MapContainer } from "@/components/MapContainer";

export const Container = ({}) => {
  return (
    <div className="flex w-full ">
      <div className="w-2/6 p-6">
        <img src="/svg.svg" />
      </div>
      <div className="w-4/6  h-full">
        <MapContainer />
      </div>
    </div>
  );
};
