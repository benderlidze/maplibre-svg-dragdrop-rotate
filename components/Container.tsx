import { MapContainer } from "@/components/MapContainer";

export const Container = ({}) => {
  return (
    <div className="flex w-full">
      <div className="flex flex-col w-2/6 p-6 gap-4">
        <div>
          <img src="svg/selected/F_D_1_0_0_0_2_0.svg" draggable />
        </div>
        <div>
          <img src="svg/selected/F_D_2_9_0_0_0_0.svg" draggable />
        </div>
        <div>
          <img src="svg/selected/F_S_2_6_0_1_0_0.svg" draggable />
        </div>
        <div>
          <img src="svg/selected/F_S_2_6_1_0_2_0.svg" draggable />
        </div>
        <div>
          <img src="svg/selected/F_S_2_7_0_2_0_0.svg" draggable />
        </div>
        <div>
          <img src="svg/selected/F_S_2_9_0_0_0_0.svg" draggable />
        </div>
        {/* <div>
          <img src="/svg.svg" />
        </div> */}
      </div>
      <div className="w-4/6  h-full">
        <MapContainer />
      </div>
    </div>
  );
};
